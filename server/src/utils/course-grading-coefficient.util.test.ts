import { describe, expect, it } from 'vitest';
import {
  parseGradingCoefficient,
  courseGradingCoefficientMap,
  computeOverallAverageFromCourseAverages,
} from './course-grading-coefficient.util';

describe('parseGradingCoefficient', () => {
  it('accepte un nombre valide', () => {
    expect(parseGradingCoefficient(2)).toBe(2);
    expect(parseGradingCoefficient('1,5')).toBe(1.5);
  });

  it('rejette les valeurs hors plage', () => {
    expect(() => parseGradingCoefficient(0)).toThrow();
    expect(() => parseGradingCoefficient(200)).toThrow();
  });
});

describe('computeOverallAverageFromCourseAverages', () => {
  it('pondère par le coefficient matière', () => {
    const courseAverages = {
      a: { average: 16, count: 1 },
      b: { average: 10, count: 1 },
    };
    const grades = [{ courseId: 'a' }, { courseId: 'b' }];
    const coeffs = { a: 2, b: 1 };
    // (16*2 + 10*1) / 3 = 14
    expect(
      computeOverallAverageFromCourseAverages(courseAverages, grades, coeffs),
    ).toBeCloseTo(14);
  });
});

describe('courseGradingCoefficientMap', () => {
  it('utilise 1 par défaut', () => {
    expect(
      courseGradingCoefficientMap([
        { id: 'x', gradingCoefficient: null },
        { id: 'y', gradingCoefficient: 3 },
      ]),
    ).toEqual({ x: 1, y: 3 });
  });
});
