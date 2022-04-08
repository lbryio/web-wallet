import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadSeedComponent } from './load-seed.component';

describe('LoadSeedComponent', () => {
  let component: LoadSeedComponent;
  let fixture: ComponentFixture<LoadSeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadSeedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadSeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
