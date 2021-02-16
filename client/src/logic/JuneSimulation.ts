import * as tp from "@/types"
import * as R from "ramda"
import Config from "./ui_config"

const stringFields = new Set(["timestamp", "region", "date_time"])

/**
 * Convert provided time string into javascript Date
 */
function toDate(day: string): Date {
    const dateArgs = <[number, number, number]>day.split("-").slice(0, 3).map(Number)
    dateArgs[1] = dateArgs[1] - 1; // Months are 0 indexed. Why?

    return new Date(...dateArgs)
}

/**
 * Add the numeric fields of two runs at certain timestepsto create a new run with only numeric fields
 *
 * @param a
 * @param b
 */
function addPoints(a: tp.BaseRunData, b: tp.BaseRunData): tp.BaseRunData {
    const newObj: any = {}

    Object.keys(a).filter(k => !stringFields.has(k)).forEach(k => {
        //@ts-ignore
        newObj[k] = +((+a[k]) + (+b[k]))
    })
    return <tp.BaseRunData>newObj
}

/**
 * Divide a datapoint by a constant
 */
function dividePointBy(point: tp.RunData | tp.RunDataNoRegionInfo | tp.BaseRunData, x: number): tp.BaseRunData {
    const out = {}
    Object.keys(point).filter(k => !stringFields.has(k)).map(k => {
        //@ts-ignore
        out[k] = point[k] / x
    })
    return <tp.BaseRunData>out
}

function getNumericalFields(pt: tp.RunData): tp.BaseRunData {
    const goodKeys = Object.keys(pt).filter(k => !stringFields.has(k))
    //@ts-ignore
    return R.pick(goodKeys, pt)
}

/**
 * Accumulate a trace whenever a time_stamp is identical
 */
function aggregateTrace(trace: tp.RunData[]): tp.RunDataNoRegionInfo[] {
    let aggRows: { [key: string]: tp.BaseRunData } = {}
    trace.forEach(t => {
        const kk = t.timestamp
        const numericalInfo = getNumericalFields(t)
        if (aggRows[kk] == undefined) {
            aggRows[kk] = numericalInfo
        }
        else {
            aggRows[kk] = addPoints(aggRows[kk], numericalInfo)
        }
    })
    // Convert aggRows back into an expected sequence of data
    const aggTrace: tp.RunDataNoRegionInfo[] = Object.keys(aggRows).map(k => {
        return {
            ...aggRows[k],
            timestamp: k,
            date_time: new Date(toDate(k))
        }
    })
    // Also has time_stamp and date_time
    return aggTrace
}

/**
 * Wrapper around each dataset in a project.
 */
export class JuneSim {
    values: tp.RunData[]
    run_parameters: tp.RunParameters
    runId: string

    constructor(values: tp.RawRunData[], params: tp.RunParameters, runId: string) {
        this.values = values.map(row => {
            const newRow = <tp.RunData><unknown>Object.assign({}, row)
            newRow.date_time = toDate(row.timestamp)
            return newRow
        })
        this.run_parameters = params
        this.runId = runId
    }

    get allRegions(): string[] {
        return Array.from(new Set(this.values.map(v => v.region))) as string[]
    }

    get nRegions(): number {
        return this.allRegions.length
    }

    ageBinKeys(keyPrefix = "currently_susceptible_"): string[] {
        const vi = this.values[0] // Assume value exists
        const susBins = Object.keys(vi).filter(k => k.startsWith(keyPrefix))
        const ageBins = susBins.map(k => k.split("_").slice(-2).join("_"))
        return ageBins
    }

    ageBinCounts(trace: tp.RunDataNoRegionInfo[]): { [k: string]: number } {
        const vi = trace[0]
        const ageBins = this.ageBinKeys()
        const susBins = ageBins.map(age => `currently_susceptible_${age}`)
        const infBins = ageBins.map(age => `currently_infected_${age}`)
        //@ts-ignore
        const ageCounts = R.zip(susBins, infBins).map(k => (+vi[k[0]]) + (+vi[k[1]]))
        const out = R.zipObj(ageBins, ageCounts)
        return out
    }

    numericFieldsAvailable(): string[] {
        return Object.keys(this.values[0]).filter(key => !stringFields.has(key))
    }

    /**
     * Fetch all available regions
     * @param basicSet Parameters to add to available regions
     */
    regionsAvailable(basicSet: string[] = ["all", "average"]): string[] {
        const regionSet = new Set(this.values.map(v => v.region))
        basicSet.forEach(s => regionSet.add(s))
        return Array.from(regionSet) as string[]
    }


    aggregateByAllRegions(): tp.RunDataNoRegionInfo[] {
        return aggregateTrace(this.values)
    }

    aggregateByAvgRegion(): tp.RunDataNoRegionInfo[] {
        const trace = aggregateTrace(this.values)
        return trace.map(t => {
            return <tp.RunDataNoRegionInfo>{
                timestamp: t.timestamp,
                date_time: t.date_time,
                ...dividePointBy(t, this.nRegions)
            }
        })
    }

    aggregateByRegion(region: string): tp.RunDataNoRegionInfo[] {
        if (region == "all") {
            return this.aggregateByAllRegions()
        }
        else if (region == "average") {
            return this.aggregateByAvgRegion()
        }
        return this.values.filter(v => v.region == region)
    }

    /**
     * Extract the trace corresponding to a particular region and field
     * 
     * @param region Which region to filter by, including "average" and "all"
     * @param field Which field to extract
     */
    getTraceWithField(region: string, field: string): { x: Date | number, y: any }[] {
        const procRun = (v: tp.RunDataNoRegionInfo, i: number) => {
            if (Config.showRealDate) {
                //@ts-ignore
                return { x: v.date_time, y: +v[field] }
            }
            //@ts-ignore
            return { x: i, y: +v[field] }
        }

        if (region == "all") {
            return this.aggregateByAllRegions().map(procRun)
        }
        else if (region == "average") {
            return this.aggregateByAvgRegion().map(procRun)
        }
        return this.values.filter(v => v.region == region).map(procRun)
    }
}
