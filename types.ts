export interface AgreementData {
  agreementNumber: string;
  agreementDate: string;
  renter: {
    fullName: string;
    dob: string;
    dlNumber: string;
    dlExp: string;
    address: string;
    cityStateZip: string;
    phonePrimary: string;
    phoneSecondary: string;
    email: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
    employerName: string;
    employerPhone: string;
    monthlyIncome: string;
  };
  vehicle: {
    yearMakeModel: string;
    vin: string;
    plateNumber: string;
    color: string;
    odometer: string;
    fuelLevel: string;
    damage: string;
    inspectionInitials: string;
  };
  rentalTerm: {
    startDate: string;
    endDate: string;
    duration: string;
    rate: string;
    ratePeriod: 'day' | 'week' | 'month' | 'custom';
    customRatePeriod: string;
  };
  payment: {
    baseRate: string;
    deposit: string;
    cleaningFee: string;
    insuranceSurcharge: string;
    gpsFee: string;
    totalDue: string;
    recurringAmount: string;
    dueDates: string;
    methods: string;
    acknowledgmentInitials: string;
  };
  insurance: {
    acknowledgmentInitials: string;
  };
  gps: {
    acknowledgmentInitials: string;
  };
  geo: {
    acknowledgmentInitials: string;
  };
  recovery: {
    acknowledgmentInitials: string;
  };
  options: {
    unlimitedMileage: boolean;
    limitedMileageCap: string;
    limitedMileagePeriod: 'day' | 'week' | 'month';
    excessMileageCost: string;
  };
  signatures: {
    renterName: string;
    renterSig: string;
    renterDate: string;
    companyRepName: string;
    companyRepTitle: string;
    companyRepSig: string;
    companyRepDate: string;
  };
  condition: {
    frontBumper: string; frontBumperNotes: string;
    rearBumper: string; rearBumperNotes: string;
    driverSide: string; driverSideNotes: string;
    passengerSide: string; passengerSideNotes: string;
    hood: string; hoodNotes: string;
    roof: string; roofNotes: string;
    trunk: string; trunkNotes: string;
    windshield: string; windshieldNotes: string;
    rearWindow: string; rearWindowNotes: string;
    sideMirrors: string; sideMirrorsNotes: string;
    tires: string; tiresNotes: string;
    interior: string; interiorNotes: string;
    lights: string; lightsNotes: string;
    signals: string; signalsNotes: string;
    horn: string; hornNotes: string;
    hvac: string; hvacNotes: string;
    photosTaken: boolean;
    photoCount: string;
    renterInitials: string;
    repInitials: string;
  };
  additionalDrivers: {
    d1Name: string; d1Dob: string; d1Dl: string; d1Rel: string; d1Ins: boolean; d1Sig: string; d1Date: string;
    d2Name: string; d2Dob: string; d2Dl: string; d2Rel: string; d2Ins: boolean; d2Sig: string; d2Date: string;
  }
}