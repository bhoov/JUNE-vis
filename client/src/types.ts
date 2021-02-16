// For one run, how do the run parameters change
export interface RunParameters {
  [key: string]: number | boolean
}

// Describes the format for storing the run parameters in the metadata
export interface RunParametersRecord {
  [key: string]: RunParameters
}

export interface FieldStatistic {
  min: number
  max: number
}

export interface ProjectDescription {
  description: string,
  parameters_varied: string[],
  run_parameters: { [key: string]: RunParameters },
  project: string
  all_regions: string[]
  all_timestamps: string[]
  all_fields: string[]
  field_statistics: { [key: string]: FieldStatistic }
}

// Columns for each simulated run
export interface BaseRunData {
  currently_dead: number
  currently_in_hospital: number
  currently_in_hospital_0_12?: number
  currently_in_hospital_12_25?: number
  currently_in_hospital_25_65?: number
  currently_in_hospital_65_101?: number
  currently_infected: number
  currently_infected_0_12?: number
  currently_infected_12_25?: number
  currently_infected_25_65?: number
  currently_infected_65_101?: number
  currently_recovered: number
  currently_recovered_0_12?: number
  currently_recovered_12_25?: number
  currently_recovered_25_65?: number
  currently_recovered_65_101?: number
  currently_susceptible: number
  currently_susceptible_0_12?: number
  currently_susceptible_12_25?: number
  currently_susceptible_25_65?: number
  currently_susceptible_65_101?: number
  deaths: number
  deaths_0_12?: number
  deaths_12_25?: number
  deaths_25_65?: number
  deaths_65_101?: number
  hospital_admissions: number
  hospital_admissions_0_12?: number
  hospital_admissions_12_25?: number
  hospital_admissions_25_65?: number
  hospital_admissions_65_101?: number
  icu_admissions: number
  infected: number
  infected_0_12?: number
  infected_12_25?: number
  infected_25_65?: number
  infected_65_101?: number
  n_infections_in_communal?: number
  n_infections_in_distribution_center?: number
  n_infections_in_e_voucher?: number
  n_infections_in_play_group?: number
  n_infections_in_pump_latrine?: number
  n_infections_in_religious?: number
  n_infections_in_shelter?: number

  [key: string]: string | Date | number | undefined
}

// Read from the CSV
export interface RawRunData extends BaseRunData {
  timestamp: string
  region: string
}

// Processed from CSV
export interface RunData extends BaseRunData {
  timestamp: string
  date_time: Date
  region: string
}

export interface RunDataNoRegionInfo extends BaseRunData {
  timestamp: string
  date_time: Date
}

export interface RunDescription {
  run_parameters: RunParameters,
  values: RunData[]
}
export interface ParamOptions {
  name: string;
  options: any[];
}

export type ParamQuery = { [key: string]: any[] }

export interface Trace {
  x: any[]
  y: any[]
  name?: string
  line?: any
}

export interface TraceStatistics {
  min: number
  max: number
  dateOfPeak: Date
  sumTilPeak: number
}

export type TraceStatisticsRecords = {[key: string]: TraceStatistics }

export interface GeoJsonFeature {
  type: string
  properties: {
    Area_Acre: number
    Area_SqM: number
    New_Camp_N: string
    New_Camp_1: string
    SSID: string
    District: string
    Upazila: string
    Union: string
    Settlement: string
    Name_Alias: string
    code: string
  }
  geometry: {
    type: string
    coordinates: [number,number][][]
  }
}

export interface GeoJson {
  type: string
  crs: {
    type: string
    propterties: {
      name: string
    }
  }
  features: GeoJsonFeature[]
}