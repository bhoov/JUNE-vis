/**
 * API file for requesting the information needed by the frontend.
 *
 * Only include methods that return data as needed for the interface.
 * All views and components should only need to call this file to fetch
 * the data they need
 */

import {text} from "d3-fetch"
import { memoize } from "@/utils/cacher"
import { JuneProject } from "@/logic/JuneProject"
import { JuneSim } from "@/logic/JuneSimulation"
import * as tp from "@/types"
import { ExtendedFeatureCollection } from "d3-geo";
import { formatValDisplay } from "@/logic/display"

export const allProjectNames: () => Promise<string[]> = memoize(async () => {
    // Fix this
    const value = await text("demo/availableProjects.txt")
    return value.trim().split("\n")
})

export const getProject: (p_id: string) => Promise<JuneProject> = memoize((p_id: string) => {
    return JuneProject.build(p_id)
})

export async function projectDescription(p_id: string): Promise<string> {
    const project = await getProject(p_id)
    return project.description
}

export async function projectRunParameters(p_id: string): Promise<tp.RunParametersRecord> {
    const project = await getProject(p_id)
    return project.run_parameters
}


export async function getRun(p_id: string, run_id: string): Promise<JuneSim> {
    const project = await getProject(p_id)
    return project.getRun(run_id)
}

export async function getRuns(p_id: string, run_ids?: string[]): Promise<JuneSim[]> {
    const project = await getProject(p_id)
    return project.getRuns(run_ids)
}

/**
 * Return the trace for a single region
 */
export async function getTrace(p_id: string, run_id: string, region: string) {
    const run = await getRun(p_id, run_id)
    return run.values.filter(v => v.region == region)
}

/**
 * Return the traces for a single region
 */
export async function getTraces(p_id: string, run_ids: string[], region: string) {
    const runs = await getRuns(p_id, run_ids)
    return runs.map(r => r.values.filter(v => v.region == region))
}

/**
 * Get the trace representing all the information from a region
 */
export async function getRegionTrace(p_id: string, run_id: string, region: string): Promise<tp.RunDataNoRegionInfo[]> {
    const run = await getRun(p_id, run_id)
    return run.aggregateByRegion(region)
}

export async function getParamSelection(p_id: string): Promise<tp.ParamOptions[]> {
    const project = await getProject(p_id)
    return project.paramList
}

/** 
 * Return the trace for a single region, given a particular field
 */
export async function getTraceWithField(p_id: string, run_id: string, region: string, field: string): Promise<{ x: Date | number, y: any }[]> {
    const run = await getRun(p_id, run_id)
    return run.getTraceWithField(region, field)
}

/**
 * Extract default run-parameters for project
 */
export async function getRunParameters(p_id: string, run_id: string): Promise<tp.RunParameters> {
    const run = await getRun(p_id, run_id)
    return run.run_parameters
}

/**
 * Get the extent of different min max across field names
 */
export async function getFieldExtent(p_id: string, fieldNames: string[]): Promise<[number, number]> {
    const project = await getProject(p_id)
    return project.fieldExtent(fieldNames)
}

export async function allRegions(p_id: string): Promise<string[]> {
    const project = await getProject(p_id)
    return project.all_regions
}

export async function allFields(p_id: string): Promise<string[]> {
    const project = await getProject(p_id)
    return project.all_fields
}

export async function numericFields(p_id: string): Promise<string[]> {
    const project = await getProject(p_id)
    return project.numeric_fields
}

export async function allDatetimes(p_id: string): Promise<Date[]> {
    const project = await getProject(p_id)
    return project.all_datetimes
}

export async function allTimestamps(p_id: string): Promise<string[]> {
    const project = await getProject(p_id)
    return project.all_timestamps
}

export async function getGeoData(p_id: string) {
    const project = await getProject(p_id)
    return project.geoFile()
}

export async function getGeoProjection(p_id: string, width: number, height: number) {
    const project = await getProject(p_id)
    return project.geoProjection(width, height)
}

export async function filterByParamSelection(p_id: string, query: tp.ParamQuery): Promise<string[]> {
    const project = await getProject(p_id)
    return project.filterBySelection(query)
}

/**
 *  Get legend values across paramName
 */
export async function getLegend(p_id: string, run_ids: string[], paramName: string): Promise<string[]> {
    const runs = await getRuns(p_id, run_ids)
    return runs.map(run => {
        let v = run.run_parameters[paramName]
        if (paramName == "") {
            return `run-${run.runId}`
        }
        return `${paramName}=${formatValDisplay(v)}`
    })
}

export async function baseNumericFields(p_id: string) {
    const project = await getProject(p_id)
    const out = project.baseNumericFields
    return out
}