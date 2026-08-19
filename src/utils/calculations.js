import area from '@turf/area';
import length from '@turf/length';
import { polygon, lineString } from '@turf/helpers';

/**
 * @param {Array<[number, number]>} points - [lng, lat] pairs, NOT closed (no repeated first point)
 */
export function computePolygonStats(points) {
  if (points.length < 3) {
    return { areaSqm: 0, perimeterM: 0 };
  }

  const ring = [...points, points[0]];
  const areaSqm = area(polygon([ring]));
  const perimeterM = length(lineString(ring), { units: 'kilometers' }) * 1000;

  return { areaSqm, perimeterM };
}
