import { TestBed } from '@angular/core/testing';

import { VibrationService } from './vibration';

describe('Vibration', () => {
  let service: VibrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VibrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
