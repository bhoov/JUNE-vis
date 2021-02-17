export function formatValDisplay(val: any) {
    if (typeof val == "number") return val.toFixed(2);
    return val;
}

/**
 * The default color cycle for Plotly. Can be customized to any length and any colors.
 */
export const colorway = [
    "#00AEEF",
    "#9B4531",
    "#FFB100",
    "#CF8236",
    "#007BE0",
    "#665E1E",
    "#487D7C",
    "#00447C",
    "#CF5C42",
    "#5D6263",
] 

/**
 * Color a line according to an index
 */
export const lineColor = (i: number) => colorway[i % colorway.length]
