import {ExtendedFeature} from "d3-geo";

export interface SiteGeo extends ExtendedFeature<GeoJSON.Polygon>{
  geometry: {
    type: "Polygon",
    coordinates: number[][][] // shape x point x [lat,long]
  },
  properties: {
    Area_Acre: number
    Area_SqM: number
    District: string
    Name_Alias: string
    New_Camp_1: string
    New_Camp_N: string
    SSID: string
    Settlement: string
    Union: string
    Upazila: string
    code: string
  },
  type: "Feature"
}