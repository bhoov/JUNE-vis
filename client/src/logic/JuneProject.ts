import { json, csv } from "d3-fetch"
import { format } from "d3-format";
import { ascending } from "d3-array";
import * as tp from "@/types"
import * as R from "ramda"
import { JuneSim } from "./JuneSimulation"
import { ExtendedFeatureCollection, geoMercator, GeoProjection } from "d3-geo";
import { SiteGeo } from "@/logic/GeoTypes";

var LRU = require("lru-cache")

const basepath = "demo/projects"

function toDate(day: string): Date {
    const dateArgs = <[number, number, number]>day.split("-").slice(0, 3).map(Number)
    dateArgs[1] = dateArgs[1] - 1; // Months are 0 indexed. Why?

    return new Date(...dateArgs)
}

export function isAgeField(field: string): boolean {
    const nums = field.split('_').slice(-2).map(x => +x)
    return R.all((x:number) => !isNaN(x))(nums)
}


/**
 * Initialize a class from asynchronous data.
 *
 * Usage (inside async function):
 * >>> const project = await JuneProject.build(project_id)
 * >>> // project logic
 *
 * Usage (inside synchronous function):
 * >>> JuneProject.build(project_id).then(p => {
 * >>>    // project logic...
 * >>> })
 */
export class JuneProject {
    folder: string
    metadata: tp.ProjectDescription

    _baseCache: typeof LRU // for fetching statistics about project
    _runCache: typeof LRU // No typescript implemented for this...

    _geoData: (Promise<tp.GeoJson> | null) = null


    // Use `.build(projectName)` to initialize this class
    protected constructor(folder: string, metadata: tp.ProjectDescription) {
        this.folder = folder
        this.metadata = metadata
        this._runCache = new LRU(50) // Should this number be smaller?
        this._baseCache = new LRU(100) // Shouldn't hold large info
    }

    public static async build(folder: string): Promise<JuneProject> {
        console.log("Building project from folder: ", folder);
        const projectDir = `${basepath}/${folder}/metadata.json`
        const metadata: tp.ProjectDescription = await json(projectDir)
        return new JuneProject(folder, metadata)
    }

    get description(): string {
        return this.metadata.description
    }

    get all_fields(): string[] {
        return this.metadata.all_fields.sort()
    }

    get hasAgeInfo(): boolean {
        return (this.ageFieldsAvailable.size > 0)
    }

    get hasLocOfInfectionInfo(): boolean {
        return this.locOfInfectionFields.length > 0
    }

    get numeric_fields(): string[] {
        // Every numeric field has a statistic
        return Object.keys(this.metadata.field_statistics).sort()
    }

    get ageFieldsAvailable(): Set<string> {
        const valid = this.all_fields.filter(isAgeField).map(f => f.split('_').slice(0,-2).join('_'))
        return new Set(valid)
    }

    /**
     * Return all fields without age annotations
     */
    get baseAllFields(): string[] {
        return this.all_fields.filter(f => !isAgeField(f))
    }

    /**
     * Return all fields without age annotations
     */
    get baseNumericFields(): string[] {
        return this.numeric_fields.filter(f => !isAgeField(f))
    }

    get locOfInfectionFields(): string[] {
        return this.all_fields.filter(f => f.startsWith("n_infections_in"))
    }

    get all_regions(): string[] {
        return this.metadata.all_regions
    }

    get available_regions(): string[] {
        return ["all", "average", ...this.all_regions]
    }

    get all_timestamps(): string[] {
        return this.metadata.all_timestamps
    }

    get all_datetimes(): Date[] {
        return this.metadata.all_timestamps.map(t => new Date(toDate(t)))
    }

    get run_parameters(): tp.RunParametersRecord {
        return this.metadata.run_parameters
    }

    /**
     * Return a list of all available values for each hyperparametere, lazily
     */
    get paramList(): tp.ParamOptions[] {
        const key = "paramList"
        if (!this._baseCache.has(key)) {
            function sortAscendingHelper(a: any, b: any): number {
                if ((typeof a == "number") && (typeof b == "number")) return a - b
                else if ((typeof a == "string") && (typeof b == "string")) return a > b ? 1 : -1
                else if ((typeof a == "boolean") && (typeof b == "boolean")) return a > b ? -1 : 1
                return 0
            }
            const pListed = Object.entries(this.paramSet).map(([k, v]) => {
                return {
                    name: k,
                    options: Array.from(this.paramSet[k]).sort(sortAscendingHelper)
                }
            })
            this._baseCache.set(key, pListed);
        }
        return this._baseCache.get(key)
    }

    get parameters_varied() {
        return this.metadata.parameters_varied
    }

    get sorting_parameters() {
        return ["ID", ...this.metadata.parameters_varied]
    }

    /**
     * Get a set of all available values for each hyperparameter, lazily
     */
    protected get paramSet() {
        const key = "paramSet"
        if (!this._baseCache.has(key)) {
            const pset: { [key: string]: Set<any> } = {}
            Object.values(this.run_parameters).forEach(params => {
                Object.keys(params).forEach(k => {
                    if (k in pset) {
                        pset[k].add(params[k])
                    } else {
                        pset[k] = new Set([])
                    }
                })
            })
            this._baseCache.set(key, pset)
        }
        return this._baseCache.get(key)
    }

    get runKeys() {
        return Object.keys(this.metadata.run_parameters)
    }

    get path() {
        return `${basepath}/${this.folder}`
    }

    fieldExtent(fieldNames: string[]): [number, number] {
        // Only works if fieldNames length > 0
        const fieldStats = fieldNames.map(f => this.metadata.field_statistics[f])
        return fieldStats.reduce((acc, stat) => {
            const newMin = stat.min < acc[0] ? stat.min : acc[0]
            const newMax = stat.max > acc[1] ? stat.max : acc[1]
            return [newMin, newMax]
        }, [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
    }

    async geoFile(): Promise<tp.GeoJson> {
        if (this._geoData == null) {
            this._geoData = json(`${this.path}/sites.geojson`);
        }
        return this._geoData;
    }

    async geoProjection(width: number, height: number): Promise<GeoProjection> {
        const geoData: any = await this.geoFile();
        const goodSSIDs = new Set(this.all_regions)

        // projection:
        const geoProjection = geoMercator();
        const visibleObject = {
            type: "FeatureCollection",
            features: geoData.features
                .filter((f: SiteGeo) => (goodSSIDs.has(f.properties.SSID)
                    || goodSSIDs.size === 0))
        };
        geoProjection.fitSize([width, height],
            visibleObject as ExtendedFeatureCollection);

        return geoProjection;
    }

    /**
     * Choose smart parameter default. Outputs a list of keys for every key, unless `outputSet` specified, in which case we output a set
     * @param outputSet If true, return object of {[key:string]: Set}
     */
    async defaultSelected(outputSet: boolean = false): Promise<{ [key: string]: any[] }> {
        const outputSelected: any = {}
        //@ts-ignore
        const defaultSim: { [key: string]: tp.RunParameters } = this.run_parameters[0]
        Object.keys(defaultSim).forEach(k => {
            outputSelected[k] = outputSet ? new Set([defaultSim[k]]) : [defaultSim[k]]
        })
        return outputSelected
    }

    /**
     * Filter runs that match the key:value pair 
     */
    filter(key: string, value: any): string[] {
        return Object.entries(this.run_parameters)
            .filter(([run_id, params]) => {
                return params[key] == value
            })
            .map(([run_id, params]) => run_id)
    }

    /**
     * Filter by the data format in 'param selector', {PARAM_NAME: [VALUE1, VALUE2,...]}.
     * If the filter value of a string is the empty [] or null, assume all parameters are valid
     * @param filterObj
     */
    filterBySelection(filterObj: tp.ParamQuery): string[] {
        const allValidRunKeys = new Set(this.runKeys)
        const keySets = Object.entries(filterObj).map(([k, values]) => {
            // Treat empty arrays as a full set
            if (values.length == 0) {
                return allValidRunKeys
            }
            const valueRow: string[] = values.reduce((acc, v) => [...acc, ...this.filter(k, v)], [])
            const valueRowSet = new Set<string>(valueRow)
            return valueRowSet
        })
        const finalKeys = keySets.reduce((acc, runs) => {
            const newRunKeys = [...runs].filter(r => acc.has(r))
            return new Set(newRunKeys)
        }, allValidRunKeys)
        return Array.from(<Set<string>><unknown>finalKeys)
    }

    async getRun(run_id: string): Promise<JuneSim> {
        const f3 = format('03i')
        const fname = this.path + `/summary_${f3(Number(run_id))}.csv`

        if (!this._runCache.has(fname)) {
            console.log("Setting cache of run... -- ", fname);

            // Add run parameters to object
            this._runCache.set(fname, (<Promise<any>>csv(fname)).then((data: tp.RawRunData[]) => {
                const run_parameters = this.run_parameters[run_id]
                return new JuneSim(data, run_parameters, run_id)
            }))
        }
        return this._runCache.get(fname)
    }

    /**
     * Get the information from a list of runs.
     *
     * @param runIDs List of run keys to fetch. If empty, assume all is desired
     */
    async getRuns(runIDs?: string[] | null): Promise<JuneSim[]> {
        if (runIDs == null) {
            runIDs = this.runKeys
        }
        return Promise.all(runIDs.map((r: string) => this.getRun(r)))
    }
}
