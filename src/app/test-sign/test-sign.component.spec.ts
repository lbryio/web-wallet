import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestSignComponent } from './test-sign.component';

describe('TestSignComponent', () => {
  let component: TestSignComponent;
  let fixture: ComponentFixture<TestSignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestSignComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
