import { TestBed } from '@angular/core/testing';
import { contrastRatio, readableTextColor } from './contrast';
import { AddPersonComponent } from '../components/add-person/add-person.component';

describe('readableTextColor', () => {
  it('keeps white text on dark colors and uses black on light ones', () => {
    expect(readableTextColor('#1a237e')).toBe('#ffffff');
    expect(readableTextColor('#ffeb3b')).toBe('#000000');
    expect(readableTextColor('#4CAF50')).toBe('#000000');
  });

  it('accepts the short #rgb form', () => {
    expect(readableTextColor('#000')).toBe('#ffffff');
    expect(readableTextColor('#fff')).toBe('#000000');
  });

  it('falls back to white for anything that is not a hex color', () => {
    expect(readableTextColor('teal')).toBe('#ffffff');
  });

  it('reaches 4.5:1 on every color a person can pick', () => {
    const palette = TestBed.createComponent(AddPersonComponent).componentInstance.predefinedColors;
    expect(palette.length).toBeGreaterThan(100);

    for (const color of palette) {
      expect(contrastRatio(color, readableTextColor(color))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
