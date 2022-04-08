import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestLbryLogInComponent } from './test-lbry-log-in.component';

describe('TestLbryLogInComponent', () => {
  let component: TestLbryLogInComponent;
  let fixture: ComponentFixture<TestLbryLogInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestLbryLogInComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestLbryLogInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
