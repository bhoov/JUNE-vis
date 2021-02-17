/**
 * Fetch a random integer between 0 and max
 * 
 * @param max Max integer to get between
 */
export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
* Given extents t1 and t2 of type [min, max], find a range that encompasses both
 * @param t1 - First extent
 * @param t2 - First extent
 */
export function encompass(t1: [number, number], t2: [number, number]): [number, number] {
    return [Math.min(t1[0], t2[0]), Math.max(t1[1], t2[1])]
}