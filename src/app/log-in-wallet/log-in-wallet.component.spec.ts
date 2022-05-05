import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogInWalletComponent } from './log-in-wallet.component';

describe('LogInWalletComponent', () => {
  let component: LogInWalletComponent;
  let fixture: ComponentFixture<LogInWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogInWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogInWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
