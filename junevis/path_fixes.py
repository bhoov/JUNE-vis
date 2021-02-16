"""Fix the paths to important folders in this repository."""

from pathlib import Path
import os

ROOT = Path(
    os.path.abspath(__file__)
).parent.parent  # Root directory of the project
SCRIPTS = ROOT / "scripts"
CLIENT = ROOT / "client"
PUBLIC = CLIENT / "public"
DIST = CLIENT / "dist"
DEMO = PUBLIC / "demo"
PROJECTS = DEMO / "projects"
DEFAULT_GEOJSON = DEMO / "coxs_bazar.geojson"
AVAILABLE_PROJECTS = DEMO / "availableProjects.txt"