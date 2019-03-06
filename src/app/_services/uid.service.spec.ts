import { TestBed } from '@angular/core/testing';

import { UIDService } from './uid.service';

describe('UIDService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UIDService = TestBed.get(UIDService);
    expect(service).toBeTruthy();
  });
});
