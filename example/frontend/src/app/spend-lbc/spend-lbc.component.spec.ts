import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpendLBCComponent } from "./spend-lbc.component";

describe("SpendLBCComponent", () => {
  let component: SpendLBCComponent;
  let fixture: ComponentFixture<SpendLBCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpendLBCComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpendLBCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
