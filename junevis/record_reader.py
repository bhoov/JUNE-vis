from pathlib import Path
from typing import *
import numpy as np
import pandas as pd
import tables
import logging

logger = logging.getLogger(__name__)


class RecordReader:
    def __init__(self, record_file: Union[Path, str], summary_csv: Optional[Union[Path, str]] = None):
        self.record_file = Path(record_file)

        if summary_csv is not None:
            self.summary_csv = Path(summary_csv)
            self.regional_summary = self.get_regional_summary(
                self.summary_csv
            )
            self.world_summary = self.regional_summary.drop(columns="region") \
                .groupby("time_stamp") \
                .agg(self.aggregator)

    @classmethod
    def from_results_path(cls, results_path:Union[Path, str]="results", record_file: str="june_record.h5", summary_name: Optional[str]=None ):
        results_path = Path(results_path)
        record_file = results_path / record_file

        if summary_name == None:
            summary_csv = None
        else:
            if len(list(results_path.glob(summary_name))) > 0:
                summary_csv = results_path / summary_name
            else:
                raise ValueError(f"Could not find {summary_name} inside of {results_path}")

        return cls(record_file, summary_csv)

    def decode_bytes_columns(self, df):
        str_df = df.select_dtypes([np.object])
        for col in str_df:
            df[col] = str_df[col].str.decode("utf-8")
        return df

    def get_regional_summary(self, summary_path):
        df = pd.read_csv(summary_path)
        self.aggregator = {
            col: np.mean if "current" in col else sum for col in df.columns[2:]
        }
        df = df.groupby(["time_stamp", "region"], as_index=False).agg(self.aggregator)
        df.set_index("time_stamp", inplace=True)
        df.index = pd.to_datetime(df.index)
        return df

    def table_to_df(
        self, table_name: str, index: str = "id", fields: Optional[Tuple] = None
    ) -> pd.DataFrame:
        # TODO: include fields to read only certain columns
        with tables.open_file(self.record_file, mode="r") as f:
            table = getattr(f.root, table_name)
            df = pd.DataFrame.from_records(table.read(), index=index)
        df = self.decode_bytes_columns(df)
        return df

    def get_geography_df(self,):
        areas_df = self.table_to_df("areas")
        super_areas_df = self.table_to_df("super_areas")
        regions_df = self.table_to_df("regions")

        geography_df = areas_df[["super_area_id", "name"]].merge(
            super_areas_df[["region_id", "name"]],
            how="inner",
            left_on="super_area_id",
            right_index=True,
            suffixes=("_area", "_super_area"),
        )
        geography_df = geography_df.merge(
            regions_df, how="inner", left_on="region_id", right_index=True,
        )
        return geography_df.rename(
            columns={geography_df.index.name: "area_id", "name": "name_region"}
        )

    def get_table_with_extras(
        self, table_name, index, with_people=True, with_geography=True
    ):
        logger.info(f"Loading {table_name} table")
        df = self.table_to_df(table_name, index=index)
        if with_people:
            logger.info(f"Loading population table")
            people_df = self.table_to_df("population", index="id")
            logger.info(f"Merging infection and population tables")
            df = df.merge(people_df, how="inner", left_index=True, right_index=True)
            if with_geography:
                logger.info(f"Loading geography table")
                geography_df = self.get_geography_df()
                logger.info(f"Mergeing infection and geography tables")
                df = df.merge(
                    geography_df.drop_duplicates(),
                    left_on="area_id",
                    right_index=True,
                    how="inner",
                )
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df