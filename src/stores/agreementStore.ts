import { create } from 'zustand'
import type { AgreementData } from '../types'

const initialData: AgreementData = {
  agreementNumber: '',
  agreementDate: new Date().toLocaleDateString(),
  renter: {
    fullName: '', dob: '', dlNumber: '', dlExp: '',
    address: '', city: '', state: '', zip: '', phonePrimary: '', phoneSecondary: '',
    email: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    employerName: '', employerPhone: '', monthlyIncome: ''
  },
  vehicle: {
    yearMakeModel: '', vin: '', plateNumber: '', color: '',
    odometer: '', fuelLevel: '', damage: 'None', inspectionInitials: ''
  },
  rentalTerm: {
    startDate: '', endDate: '', duration: '', rate: '', ratePeriod: 'day', customRatePeriod: ''
  },
  payment: {
    baseRate: '', deposit: '', cleaningFee: '', insuranceSurcharge: '', gpsFee: '',
    totalDue: '', recurringAmount: '', dueDates: '', methods: '', acknowledgmentInitials: ''
  },
  insurance: { acknowledgmentInitials: '' },
  gps: { acknowledgmentInitials: '' },
  geo: { acknowledgmentInitials: '' },
  recovery: { acknowledgmentInitials: '' },
  options: {
    unlimitedMileage: true, limitedMileageCap: '', limitedMileagePeriod: 'day', excessMileageCost: ''
  },
  signatures: {
    renterName: '', renterSig: '', renterDate: '',
    companyRepName: 'Triple J Auto Investment LLC', companyRepTitle: 'Authorized Agent', companyRepSig: '', companyRepDate: ''
  },
  condition: {
    frontBumper: '', frontBumperNotes: '', rearBumper: '', rearBumperNotes: '',
    driverSide: '', driverSideNotes: '', passengerSide: '', passengerSideNotes: '',
    hood: '', hoodNotes: '', roof: '', roofNotes: '', trunk: '', trunkNotes: '',
    windshield: '', windshieldNotes: '', rearWindow: '', rearWindowNotes: '',
    sideMirrors: '', sideMirrorsNotes: '', tires: '', tiresNotes: '',
    interior: '', interiorNotes: '', lights: '', lightsNotes: '',
    signals: '', signalsNotes: '', horn: '', hornNotes: '', hvac: '', hvacNotes: '',
    photosTaken: false, photoCount: '', renterInitials: '', repInitials: ''
  },
  additionalDrivers: {
    d1Name: '', d1Dob: '', d1Dl: '', d1Rel: '', d1Ins: false, d1Sig: '', d1Date: '',
    d2Name: '', d2Dob: '', d2Dl: '', d2Rel: '', d2Ins: false, d2Sig: '', d2Date: ''
  }
}

interface AgreementStore {
  data: AgreementData
  isDirty: boolean
  isSaving: boolean
  agreementId: string | null
  agreementNumber: string | null
  setData: (data: AgreementData) => void
  updateField: (section: keyof AgreementData, field: string, value: unknown) => void
  setAgreementMeta: (id: string, number: string) => void
  setSaving: (saving: boolean) => void
  reset: () => void
}

export const useAgreementStore = create<AgreementStore>()((set) => ({
  data: initialData,
  isDirty: false,
  isSaving: false,
  agreementId: null,
  agreementNumber: null,
  setData: (data) => set({ data, isDirty: false }),
  updateField: (section, field, value) => set((state) => ({
    data: {
      ...state.data,
      [section]: {
        ...(state.data[section] as Record<string, unknown>),
        [field]: value
      }
    },
    isDirty: true
  })),
  setAgreementMeta: (id, number) => set({ agreementId: id, agreementNumber: number }),
  setSaving: (saving) => set({ isSaving: saving }),
  reset: () => set({ data: { ...initialData, agreementDate: new Date().toLocaleDateString() }, isDirty: false, isSaving: false, agreementId: null, agreementNumber: null })
}))
