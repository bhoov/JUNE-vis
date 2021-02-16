import pandas as pd
from pathlib import Path
import datetime
import time
from junevis.record_reader import RecordReader
from typing import *

def split_by_age(df, age_bins, out_column_name, group_on=["name_region", "timestamp"]):
    df_by_age = df.groupby(
        [pd.cut(df["age"], bins=age_bins, right=False)] + group_on,
    ).size()
    df_by_age = df_by_age.unstack(level=0, fill_value=0)
    df_by_age.columns.name = None
    df_by_age.columns = [
        out_column_name
        + "_"
        + "_".join(i.replace("[", "").replace(")", "").split(", "))
        for i in df_by_age.columns.astype(str)
    ]
    return df_by_age

def get_infection_locations(infections_df):
    n_infections_by_location = (
        infections_df.groupby(["name_region", "timestamp", "location_specs"])
        .size()
        .unstack(fill_value=0)
    )
    n_infections_by_location.columns = [
        "n_infections_in_" + col for col in n_infections_by_location.columns
    ]
    n_infections_by_location.columns.name = None
    return n_infections_by_location

def get_regional_outputs(df, age_bins, column_name):
    daily = df.groupby(["name_region", "timestamp"]).size()
    by_age = split_by_age(df, age_bins, column_name)
    pd.testing.assert_series_equal(
        daily.groupby("name_region").sum(),
        by_age.sum(axis=1).groupby("name_region").sum(),
        check_dtype=False,
    )
    return pd.DataFrame(daily.rename(column_name)).merge(
        by_age, left_index=True, right_index=True
    )

def combine_start_end(start_df, end_df):
    end_df = end_df.rename('end_timestamp')
    t0 = time.time()
    df = start_df.join(end_df, how='outer')
    df["n_days"] = df["end_timestamp"] - df["timestamp"]
    df["n_days"] = df["n_days"].apply(lambda x: x.days).fillna(0.0)

    # TODO : this bit is extremely slow!!
    df["range_dates"] = df.apply(
        lambda x: [
            x["timestamp"] + datetime.timedelta(days=day)
            for day in range(int(x.n_days))
        ],
        axis=1,
    )
    df = df[["age", "range_dates", "name_region"]].explode(column="range_dates")
    return df.rename(columns={"range_dates": "timestamp"})

def read_table_with_people(read, table, index, people_df, geography_df):
    df = read.table_to_df(table, index=index)
    df = df.merge(people_df, how="inner", left_index=True, right_index=True)
    if geography_df is not None:
        df = df.merge(geography_df, left_on="area_id", right_index=True, how="inner")
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df

def read_table_with_locations(
    read, table, index, people_df, geography_df, location_type="hospital"
):
    df = read_table_with_people(
        read, table, index=index, people_df=people_df, geography_df=geography_df
    )
    locations_df = read.table_to_df("locations", "id")
    locations_df = locations_df[locations_df["spec"] == location_type]
    locations_df.set_index("group_id", inplace=True)
    return df.merge(locations_df, left_on=f"{location_type}_ids", right_index=True)

def regional_outputs(logger_f: Union[Path, str], age_bins=(0, 12, 25, 65, 101),
        min_date= '2020-05-01',
        max_date= '2020-12-31',):
    read = RecordReader(logger_f)
    print("loading people...")
    people_df = read.table_to_df("population", index="id")
    print("loading geography...")
    geography_df = read.get_geography_df()
    geography_df = geography_df.drop_duplicates()
    print("loading infections...")
    infections_df = read_table_with_people(
        read,
        "infections",
        index="infected_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading deaths...")
    deaths_df = read_table_with_people(
        read,
        "deaths",
        index="dead_person_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading hospital admissions...")
    hosp_admissions_df = read_table_with_locations(
        read,
        "hospital_admissions",
        index="patient_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading icu admissions...")
    icu_admissions_df = read_table_with_locations(
        read,
        "icu_admissions",
        index="patient_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading discharges...")
    discharges_df = read_table_with_locations(
        read,
        "discharges",
        index="patient_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading recoveries...")
    recoveries_df = read_table_with_people(
        read,
        "recoveries",
        index="recovered_person_ids",
        people_df=people_df,
        geography_df=geography_df,
    )
    print("loading infection locations...")
    infection_locations = get_infection_locations(infections_df)
    print("loading regional infections...")
    regional_infections = get_regional_outputs(infections_df, age_bins, "infected")
    pd.testing.assert_series_equal(
        regional_infections["infected"],
        infection_locations.sum(axis=1),
        check_names=False,
    )
    print("loading regional deaths...")
    regional_deaths = get_regional_outputs(deaths_df, age_bins, "deaths")
    print("loading regional hospital admissions...")
    regional_admissions = get_regional_outputs(
        hosp_admissions_df, age_bins, "hospital_admissions"
    )
    print("loading regional icu admissions...")
    regional_icu_admissions = get_regional_outputs(
        icu_admissions_df, age_bins, "icu_admissions"
    )
    print("loading regional hospital deaths...")
    hospital_deaths_df = deaths_df[deaths_df["location_specs"] == "hospital"]
    print("loading all discharges info...")
    all_discharges_df = hospital_deaths_df["timestamp"].append(
        discharges_df["timestamp"]
    )
    print("loading hospital in/out info...")
    hospital_in_out_df = combine_start_end(hosp_admissions_df, all_discharges_df,)
    print("loading regional current in hospital...")
    regional_current_in_hospital = get_regional_outputs(
        hospital_in_out_df, age_bins, "currently_in_hospital"
    )
    print("loading all end (?) infection...")
    all_end_infection_df = deaths_df["timestamp"].append(recoveries_df["timestamp"])

    print("loading in out (?) infection. Takes a while...")
    start = time.time()
    infected_in_out_df = combine_start_end(infections_df, all_end_infection_df)
    print(f"\tTook {time.time() - start} seconds")

    print("loading regional infected...")
    regional_current_infected = get_regional_outputs(
        infected_in_out_df, age_bins, "currently_infected"
    )
    print("loading regional recovered...")
    regional_recovered = get_regional_outputs(recoveries_df, age_bins, "recovered")
    people_df = people_df.merge(
        geography_df, left_on="area_id", right_index=True, how="inner"
    )
    print("loading people by age...")
    people_by_age = split_by_age(
        people_df, age_bins, "people", group_on=["name_region"]
    )
    regional_current_susceptible = pd.DataFrame()
    idx = pd.date_range(start=min_date, end=max_date)
    multi_idx = pd.MultiIndex.from_product([list(regional_current_infected.index.levels[0]), 
        list(idx)],
        names=list(regional_current_infected.index.names))

    for column in people_by_age.columns:
        age_suffix = "_".join(column.split("_")[1:])
        infected_ever = regional_infections.groupby(level=0)[
            "infected_" + age_suffix
        ].cumsum()

        column_name = "currently_susceptible_" + age_suffix
        regional_current_susceptible[column_name] = people_by_age[column].sub(infected_ever)
        regional_current_susceptible = regional_current_susceptible.reindex(multi_idx)
        regional_current_susceptible = regional_current_susceptible.unstack(
             level=0
            ).bfill().ffill().stack()
        regional_current_susceptible = regional_current_susceptible.reorder_levels([1,0])

    regional_current_susceptible[
        "currently_susceptible"
    ] = regional_current_susceptible.sum(axis=1)

    print("Concatenating information...")
    output = pd.concat(
        [
            infection_locations,
            regional_infections,
            regional_deaths,
            regional_admissions,
            regional_icu_admissions,
            regional_current_in_hospital,
            regional_current_infected,
            regional_recovered,
            regional_current_susceptible,
        ],
        axis=1,
    ).fillna(0.0).astype(int)

    return output