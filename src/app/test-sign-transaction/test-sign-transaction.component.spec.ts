import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestSignTransactionComponent } from './test-sign-transaction.component';

describe('TestSignTransactionComponent', () => {
  let component: TestSignTransactionComponent;
  let fixture: ComponentFixture<TestSignTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestSignTransactionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestSignTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
