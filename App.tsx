import React, { useState, useRef } from 'react';
import { Section } from './components/Section';
import { InputLine } from './components/InputLine';
import { InitialsBox } from './components/InitialsBox';
import { AcknowledgmentBox } from './components/AcknowledgmentBox';
import { SignaturePad } from './components/SignaturePad';
import { AgreementData } from './types';
import { Printer, Download } from 'lucide-react';

const initialData: AgreementData = {
  agreementNumber: '',
  agreementDate: new Date().toLocaleDateString(),
  renter: {
    fullName: '', dob: '', dlNumber: '', dlExp: '',
    address: '', cityStateZip: '', phonePrimary: '', phoneSecondary: '',
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
};

const App: React.FC = () => {
  const [data, setData] = useState<AgreementData>(initialData);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const update = (section: keyof AgreementData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    const element = componentRef.current;
    
    // @ts-ignore
    if (!window.html2pdf || !element) {
      alert("PDF generator is unavailable.");
      setIsGeneratingPdf(false);
      return;
    }

    try {
      // Add 'force-desktop' class to enforce desktop layout on mobile
      element.classList.add('force-desktop');
      
      const opt = {
        margin: 0.2, // Small margin, the CSS handles the rest
        filename: `Triple_J_Agreement_${data.renter.fullName || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // Cleanup
      if (element) {
        element.classList.remove('force-desktop');
      }
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 py-4 md:py-8 print:bg-white print:py-0">
      
      {/* Control Panel */}
      <div className={`fixed top-4 right-4 z-50 no-print flex flex-row gap-2 transition-opacity ${isGeneratingPdf ? 'opacity-0' : 'opacity-100'}`}>
        <button 
          type="button"
          onClick={handlePrint}
          disabled={isGeneratingPdf}
          className="cursor-pointer flex items-center justify-center gap-2 bg-forestGreen text-white px-4 py-3 md:px-6 rounded-full shadow-lg hover:bg-green-900 transition-colors font-sans font-bold text-sm md:text-base"
        >
          <Printer size={18} />
          <span className="hidden md:inline">Print</span>
        </button>
        <button 
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="cursor-pointer flex items-center justify-center gap-2 bg-gold text-white px-4 py-3 md:px-6 rounded-full shadow-lg hover:bg-yellow-600 transition-colors font-sans font-bold text-sm md:text-base disabled:opacity-50"
        >
          <Download size={18} />
          <span className="hidden md:inline">{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
        </button>
      </div>

      <div ref={componentRef} className="max-w-[8.5in] mx-auto bg-white p-4 md:p-[0.75in] shadow-2xl print:shadow-none print:p-0 text-xs md:text-sm">
        
        {/* PAGE 1: HEADER + SECTIONS 1-3 (VERTICALLY CENTERED) */}
        <div className="flex flex-col justify-center min-h-[10.5in] md:min-h-[10in]">
          
          <header className="text-center mb-8 md:mb-10 border-b-4 border-gold pb-6">
            <h1 className="text-xl md:text-3xl font-bold font-sans text-forestGreen tracking-wide mb-1">TRIPLE J AUTO INVESTMENT LLC</h1>
            <div className="text-xs md:text-sm font-sans text-gray-600 space-y-1">
              <p>Texas Dealer License: P171632</p>
              <p>8774 Almeda Genoa Road, Houston, TX 77075</p>
              <div className="flex flex-col md:flex-row justify-center items-center gap-1 md:gap-4 mt-2 font-bold text-forestGreen">
                <span>281-253-3602</span>
                <span className="hidden md:inline text-gold">|</span>
                <span>triplejautoinvestment@gmail.com</span>
              </div>
            </div>
          </header>

          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold font-sans text-forestGreen uppercase mb-6">Vehicle Rental Agreement</h2>
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-12">
              <InputLine label="Agreement Number" value={data.agreementNumber} onChange={v => setData({...data, agreementNumber: v})} width="w-full md:w-48" />
              <InputLine label="Date of Agreement" value={data.agreementDate} onChange={v => setData({...data, agreementDate: v})} width="w-full md:w-48" />
            </div>
          </div>

          {/* SECTION 1 */}
          <Section title="Welcome & Agreement Overview" number="SECTION 1">
            <p className="text-justify mb-4 leading-relaxed">
              Triple J Auto Investment LLC ("Company," "We," "Us") is pleased to provide you with a quality rental vehicle. This Vehicle Rental Agreement ("Agreement") constitutes a legally binding contract between the Company and the individual identified below ("Renter," "You"). By signing this Agreement, you acknowledge that you have read, understood, and voluntarily agreed to ALL terms, conditions, restrictions, fees, and obligations set forth herein.
            </p>
            <p className="text-justify mb-4 leading-relaxed">
              This Agreement is governed by the laws of the State of Texas. Any dispute arising from this Agreement shall be resolved exclusively in the courts of Harris County, Texas.
            </p>
            <p className="font-bold text-forestGreen text-justify">
              This Agreement supersedes all prior verbal or written representations. No modifications to this Agreement are valid unless executed in writing and signed by an authorized representative of the Company.
            </p>
          </Section>

          {/* SECTION 2 */}
          <Section title="Renter Information" number="SECTION 2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
              <InputLine label="Full Legal Name" value={data.renter.fullName} onChange={v => update('renter', 'fullName', v)} />
              <InputLine label="Date of Birth" value={data.renter.dob} onChange={v => update('renter', 'dob', v)} />
              
              <InputLine label="Texas Driver License No." value={data.renter.dlNumber} onChange={v => update('renter', 'dlNumber', v)} />
              <InputLine label="DL Expiration Date" value={data.renter.dlExp} onChange={v => update('renter', 'dlExp', v)} />
              
              <InputLine label="Current Address" value={data.renter.address} onChange={v => update('renter', 'address', v)} className="col-span-1 md:col-span-2" />
              <InputLine label="City, State, ZIP" value={data.renter.cityStateZip} onChange={v => update('renter', 'cityStateZip', v)} className="col-span-1 md:col-span-2" />
              
              <InputLine label="Primary Phone" value={data.renter.phonePrimary} onChange={v => update('renter', 'phonePrimary', v)} />
              <InputLine label="Secondary Phone" value={data.renter.phoneSecondary} onChange={v => update('renter', 'phoneSecondary', v)} />
              
              <InputLine label="Email Address" value={data.renter.email} onChange={v => update('renter', 'email', v)} className="col-span-1 md:col-span-2" />
              
              <InputLine label="Emergency Contact Name" value={data.renter.emergencyName} onChange={v => update('renter', 'emergencyName', v)} />
              <InputLine label="Emergency Contact Phone" value={data.renter.emergencyPhone} onChange={v => update('renter', 'emergencyPhone', v)} />
              <InputLine label="Relationship" value={data.renter.emergencyRelation} onChange={v => update('renter', 'emergencyRelation', v)} className="col-span-1 md:col-span-2" />

              <InputLine label="Employer Name" value={data.renter.employerName} onChange={v => update('renter', 'employerName', v)} />
              <InputLine label="Monthly Income (Gross)" value={data.renter.monthlyIncome} onChange={v => update('renter', 'monthlyIncome', v)} />
            </div>
            <p className="text-xs md:text-sm italic font-bold text-alertRed mt-4">
              Renter must present a valid, non-expired Texas Driver License and proof of full-coverage automobile insurance at the time of vehicle pickup. Failure to provide either will result in cancellation of this Agreement.
            </p>
          </Section>

          {/* SECTION 3 */}
          <Section title="Vehicle Information" number="SECTION 3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <InputLine label="Year / Make / Model" value={data.vehicle.yearMakeModel} onChange={v => update('vehicle', 'yearMakeModel', v)} className="col-span-1 md:col-span-2" />
              <InputLine label="VIN" value={data.vehicle.vin} onChange={v => update('vehicle', 'vin', v)} />
              <InputLine label="License Plate" value={data.vehicle.plateNumber} onChange={v => update('vehicle', 'plateNumber', v)} />
              <InputLine label="Exterior Color" value={data.vehicle.color} onChange={v => update('vehicle', 'color', v)} />
              <InputLine label="Current Odometer" value={data.vehicle.odometer} onChange={v => update('vehicle', 'odometer', v)} />
              <InputLine label="Fuel Level" value={data.vehicle.fuelLevel} onChange={v => update('vehicle', 'fuelLevel', v)} />
              <InputLine label="Known Pre-Existing Damage" value={data.vehicle.damage} onChange={v => update('vehicle', 'damage', v)} className="col-span-1 md:col-span-2" />
            </div>
            <div className="bg-lightGray p-4 rounded-sm">
              <p className="font-bold text-sm mb-2">Vehicle Condition Acknowledgment:</p>
              <p className="text-xs md:text-sm mb-4">
                Renter acknowledges that they have personally inspected the Vehicle prior to taking possession and confirm that the Vehicle is in acceptable condition, mechanically operational, and free of unreported damage except as noted above. Photos documenting the Vehicle's condition at the time of pickup are attached to and made part of this Agreement.
              </p>
              <InitialsBox value={data.vehicle.inspectionInitials} onChange={v => update('vehicle', 'inspectionInitials', v)} />
            </div>
          </Section>

        </div>

        <div className="page-break"></div>

        {/* SECTION 4 */}
        <Section title="Rental Term & Payment Schedule" number="SECTION 4">
          <div className="mb-6">
            <h3 className="font-bold text-forestGreen mb-3">4.1 Rental Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InputLine label="Start Date" value={data.rentalTerm.startDate} onChange={v => update('rentalTerm', 'startDate', v)} type="date" />
              <InputLine label="End Date" value={data.rentalTerm.endDate} onChange={v => update('rentalTerm', 'endDate', v)} type="date" />
              <InputLine label="Duration" value={data.rentalTerm.duration} onChange={v => update('rentalTerm', 'duration', v)} />
              <div className="flex flex-col md:flex-row md:items-end gap-2">
                <InputLine label="Rental Rate ($)" value={data.rentalTerm.rate} onChange={v => update('rentalTerm', 'rate', v)} width="w-full md:w-32" />
                <div className="flex flex-wrap gap-4 pb-2 text-xs md:text-sm pt-2 md:pt-0 items-center">
                   <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.rentalTerm.ratePeriod === 'day'} onChange={() => update('rentalTerm', 'ratePeriod', 'day')} /> per day</label>
                   <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.rentalTerm.ratePeriod === 'week'} onChange={() => update('rentalTerm', 'ratePeriod', 'week')} /> per week</label>
                   <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.rentalTerm.ratePeriod === 'month'} onChange={() => update('rentalTerm', 'ratePeriod', 'month')} /> per month</label>
                   <div className="flex items-center gap-1">
                     <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.rentalTerm.ratePeriod === 'custom'} onChange={() => update('rentalTerm', 'ratePeriod', 'custom')} /> Other:</label>
                     {data.rentalTerm.ratePeriod === 'custom' && (
                       <input 
                         type="text" 
                         className="border-b border-charcoal bg-transparent w-24 focus:outline-none ml-1 text-forestGreen font-bold"
                         value={data.rentalTerm.customRatePeriod}
                         onChange={(e) => update('rentalTerm', 'customRatePeriod', e.target.value)}
                         placeholder="e.g. bi-weekly"
                       />
                     )}
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-forestGreen mb-3">4.2 Payment Terms</h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="bg-gray-100 p-2 font-bold text-xs uppercase hidden md:grid md:grid-cols-2 gap-4">
                <span>Fee Description</span>
                <span>Amount</span>
              </div>
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-4 md:gap-y-2 text-sm">
                <span className="font-bold md:font-normal">Base Rental Rate</span> <InputLine value={data.payment.baseRate} onChange={v => update('payment', 'baseRate', v)} />
                <span className="font-bold md:font-normal">Security/Damage Deposit (Refundable)</span> <InputLine value={data.payment.deposit} onChange={v => update('payment', 'deposit', v)} />
                <span className="font-bold md:font-normal">Vehicle Cleaning Fee (if applicable)</span> <InputLine value={data.payment.cleaningFee} onChange={v => update('payment', 'cleaningFee', v)} />
                <span className="font-bold md:font-normal">Insurance Surcharge</span> <InputLine value={data.payment.insuranceSurcharge} onChange={v => update('payment', 'insuranceSurcharge', v)} />
                <span className="font-bold md:font-normal">GPS Vehicle Safety System Fee</span> <InputLine value={data.payment.gpsFee} onChange={v => update('payment', 'gpsFee', v)} />
                <span className="font-bold text-forestGreen">Total Due at Signing</span> <InputLine value={data.payment.totalDue} onChange={v => update('payment', 'totalDue', v)} className="font-bold" />
                <span className="font-bold md:font-normal">Recurring Payment Amount</span> <InputLine value={data.payment.recurringAmount} onChange={v => update('payment', 'recurringAmount', v)} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputLine label="Payment Due Date(s)" value={data.payment.dueDates} onChange={v => update('payment', 'dueDates', v)} />
              <InputLine label="Accepted Payment Methods" value={data.payment.methods} onChange={v => update('payment', 'methods', v)} />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-forestGreen mb-3">4.3 Grace Period & Late Payment Penalties</h3>
            <p className="text-sm mb-3">The Company provides a three (3) calendar day grace period following each scheduled payment due date. If full payment is not received by 11:59 PM CST on the third (3rd) calendar day following the due date, the following penalties shall apply automatically:</p>
            <ul className="list-disc pl-5 text-sm space-y-2 mb-4">
              <li><strong className="text-alertRed">Late Fee:</strong> Twenty dollars ($20.00) per calendar day.</li>
              <li><strong className="text-alertRed">Cumulative Late Fees:</strong> Accrue without cap until paid.</li>
              <li><strong className="text-alertRed">Returned Payment Fee:</strong> Fifty dollars ($50.00) for declined/returned payments.</li>
              <li><strong className="text-alertRed">Collection Costs:</strong> Renter responsible for all legal and collection fees.</li>
            </ul>
            <p className="text-sm font-bold mb-4">Renter acknowledges that timely payment is essential to this Agreement. Failure to pay constitutes a material breach.</p>
            <AcknowledgmentBox 
              text="Renter Acknowledgment — I have read and understand the payment terms, grace period, and late fee structure described in Section 4."
              initials={data.payment.acknowledgmentInitials}
              onInitialsChange={v => update('payment', 'acknowledgmentInitials', v)}
            />
          </div>
        </Section>

        {/* SECTION 5 */}
        <Section title="Insurance & Liability Requirements" number="SECTION 5" critical>
          <div className="mb-4">
             <h3 className="font-bold text-forestGreen text-xs md:text-sm uppercase mb-2">5.1 Mandatory Insurance</h3>
             <p className="text-justify mb-2">Renter is REQUIRED to maintain valid, active full-coverage automobile insurance meeting Texas minimums (30/60/25) plus Comprehensive and Collision coverage on the rental Vehicle. The policy must remain active for the entire Rental Period.</p>
          </div>
          <div className="mb-4">
             <h3 className="font-bold text-forestGreen text-xs md:text-sm uppercase mb-2">5.2 Proof of Insurance</h3>
             <p className="text-justify mb-2">Renter must provide proof of insurance at pickup. Lapse or cancellation of insurance constitutes an immediate material breach, authorizing immediate Vehicle Recovery.</p>
          </div>
          <div className="mb-4">
             <h3 className="font-bold text-alertRed text-xs md:text-sm uppercase mb-2">5.3 Liability & Indemnification</h3>
             <p className="font-bold text-justify mb-2 uppercase">Renter assumes full and complete liability for the Vehicle from the moment of pickup until the moment the Vehicle is returned to and physically accepted by the Company.</p>
             <p className="text-justify mb-2">This includes collision, theft, vandalism, third-party claims, tickets, and tolls. <strong>INDEMNIFICATION:</strong> Renter agrees to indemnify, defend, and hold harmless Triple J Auto Investment LLC against all claims arising from Renter's use of the Vehicle.</p>
          </div>
          <div className="mb-4">
             <h3 className="font-bold text-forestGreen text-xs md:text-sm uppercase mb-2">5.4 No Liability of Company</h3>
             <p className="text-justify uppercase text-xs">The Company makes no warranties regarding the Vehicle's fitness. The Company is not liable for consequential damages.</p>
          </div>
          <AcknowledgmentBox 
            text="Renter Acknowledgment — I understand that I am fully responsible for the Vehicle and all liabilities arising from its use. I agree to maintain full-coverage insurance at all times and to indemnify the Company as described above."
            initials={data.insurance.acknowledgmentInitials}
            onInitialsChange={v => update('insurance', 'acknowledgmentInitials', v)}
          />
        </Section>

        <div className="page-break"></div>

        {/* SECTION 6 */}
        <Section title="Vehicle Safety & Recovery System (GPS)" number="SECTION 6" critical>
          <p className="text-justify mb-3">
            Renter acknowledges and consents that the Vehicle is equipped with a <strong>Vehicle Safety & Recovery System ("VSRS")</strong>, which includes electronic GPS tracking technology. This system is used for Vehicle Recovery, Safety Compliance, and Agreement Compliance.
          </p>
          <p className="text-justify mb-3">
            <strong>Consent:</strong> By signing this Agreement, Renter provides full, voluntary, informed, and irrevocable consent to the use of the VSRS. The VSRS is Company property.
          </p>
          <p className="text-justify mb-3">
            <strong className="text-alertRed">TAMPERING PENALTY:</strong> If Renter tampers with, disables, or removes the VSRS:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Immediate termination of Agreement & Forfeiture of Security Deposit.</li>
            <li>Tampering penalty of <strong>$500.00</strong> plus equipment replacement cost.</li>
            <li>Immediate Vehicle Recovery.</li>
          </ul>
          <AcknowledgmentBox 
            text="Renter Acknowledgment — I understand and consent to the GPS Vehicle Safety & Recovery System. I will not tamper with, disable, or interfere with any tracking equipment installed in the Vehicle."
            initials={data.gps.acknowledgmentInitials}
            onInitialsChange={v => update('gps', 'acknowledgmentInitials', v)}
          />
        </Section>

        {/* SECTION 7 */}
        <Section title="Geographic & Use Restrictions" number="SECTION 7" critical>
          <p className="text-justify mb-3">
            <strong>7.1 Authorized Territory:</strong> The Vehicle is authorized for operation <strong>ONLY within the State of Texas</strong>. Unauthorized cross-state travel is a material breach.
          </p>
          <p className="text-justify mb-3">
             If detected outside Texas: $250.00 penalty, immediate recovery rights, and Renter pays all return costs.
          </p>
          <p className="text-justify mb-3">
            <strong>7.2 Prohibited Uses:</strong> Illegal activity, racing, commercial use (Uber/Lyft) without auth, towing, subletting, or driving by unauthorized persons.
          </p>
          <AcknowledgmentBox 
            text="Renter Acknowledgment — I understand the geographic and use restrictions. I agree to operate the Vehicle only within the State of Texas and only for authorized purposes."
            initials={data.geo.acknowledgmentInitials}
            onInitialsChange={v => update('geo', 'acknowledgmentInitials', v)}
          />
        </Section>

        {/* SECTION 8 */}
        <Section title="Vehicle Recovery Protocol (Repossession)" number="SECTION 8" critical>
          <p className="text-justify mb-3 font-bold">
            THE COMPANY RESERVES THE ABSOLUTE RIGHT TO RECOVER (REPOSSESS) THE VEHICLE AT ANY TIME, WITHOUT PRIOR NOTICE, AND WITHOUT COURT ORDER, UPON THE OCCURRENCE OF A MATERIAL BREACH.
          </p>
          <p className="text-justify mb-2">
            Breaches include: Non-payment (7 days past due), Insurance lapse, Geo violation, Tampering, or Arrest.
          </p>
          <p className="text-justify mb-2">
            <strong>Recovery Fees:</strong> Towing costs, storage fees, plus $150.00 Admin Fee.
          </p>
          <p className="text-justify mb-2">
             Renter waives claims for trespass or conversion during lawful recovery.
          </p>
          <AcknowledgmentBox 
            text="Renter Acknowledgment — I understand the Company's right to recover the Vehicle under the conditions described. I authorize Vehicle Recovery by any lawful means and waive related claims."
            initials={data.recovery.acknowledgmentInitials}
            onInitialsChange={v => update('recovery', 'acknowledgmentInitials', v)}
          />
        </Section>

         {/* SECTION 9 */}
         <Section title="Vehicle Return & Deposit" number="SECTION 9">
          <p className="text-justify mb-3">
            <strong>9.1 Return Condition:</strong> Return to 8774 Almeda Genoa Rd, Houston TX. Must be clean, same fuel level ($4.50/gal charge), and no new damage.
          </p>
          <p className="text-justify mb-3">
            <strong>9.2 Deposit Return:</strong> Returned within 14 business days, less deductions for damage, fees, or violations.
          </p>
          <p className="text-justify">
            <strong>9.3 Late Return:</strong> 1.5x daily rate accrues. Reported stolen after 5 days.
          </p>
        </Section>

        <div className="page-break"></div>

        {/* SECTION 10 */}
        <Section title="Additional Terms & Conditions" number="SECTION 10">
          <div className="mb-4">
            <strong className="block mb-2">10.1 Mileage Limitation</strong>
            <div className="flex flex-col gap-2 pl-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.options.unlimitedMileage} onChange={e => {
                  const val = e.target.checked;
                  update('options', 'unlimitedMileage', val);
                }} />
                Unlimited mileage
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!data.options.unlimitedMileage} onChange={e => update('options', 'unlimitedMileage', !e.target.checked)} />
                  <span>Limited to</span>
                </div>
                <input type="text" className="border-b border-charcoal w-16 text-center" value={data.options.limitedMileageCap} onChange={e => update('options', 'limitedMileageCap', e.target.value)} />
                <span>miles per</span>
                <select className="bg-transparent border-b border-charcoal" value={data.options.limitedMileagePeriod} onChange={e => update('options', 'limitedMileagePeriod', e.target.value)}>
                  <option value="day">day</option>
                  <option value="week">week</option>
                  <option value="month">month</option>
                </select>
                <div className="flex items-center gap-1">
                  <span>. Excess $</span>
                  <input type="text" className="border-b border-charcoal w-12 text-center" value={data.options.excessMileageCost} onChange={e => update('options', 'excessMileageCost', e.target.value)} />
                  <span>/mile.</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-justify mb-2">
            <strong>10.2 Maintenance:</strong> Renter maintains fluids/tires. No unauthorized repairs.
          </p>
          <p className="text-justify mb-2">
            <strong>10.3 Accident Reporting:</strong> Must report to Police and Company within 2 hours.
          </p>
          <p className="text-justify mb-2">
            <strong>10.4 Smoking Policy:</strong> Strictly prohibited. $250.00 cleaning fee.
          </p>
          <p className="text-justify mb-2">
            <strong>10.5 Pet Policy:</strong> No pets without auth. $150.00 cleaning fee.
          </p>
          <p className="text-justify mb-2">
             <strong>10.6 Dispute Resolution:</strong> Negotiation -> Mediation -> Litigation in Harris County, TX.
          </p>
        </Section>

        {/* SECTION 11 */}
        <Section title="Acknowledgment & Signatures" number="SECTION 11">
          <p className="font-bold mb-4 uppercase text-xs md:text-sm">Renter's Comprehensive Acknowledgment</p>
          <p className="text-justify mb-6">
            By signing below, Renter acknowledges and agrees to ALL terms, including: Age (21+), Vehicle Condition, Insurance Maintenance, GPS Consent, Geographic Restriction (Texas Only), Late Fees, Repossession Rights, and Indemnification. I have not been coerced and have had the opportunity to seek counsel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 avoid-break">
            <div className="space-y-6">
              <h4 className="font-bold text-forestGreen uppercase text-sm border-b border-forestGreen pb-1">Renter Signature</h4>
              <InputLine label="Printed Name" value={data.signatures.renterName} onChange={v => update('signatures', 'renterName', v)} />
              
              <SignaturePad 
                label="Signature" 
                value={data.signatures.renterSig} 
                onChange={v => update('signatures', 'renterSig', v)} 
              />
              
              <InputLine label="Date" value={data.signatures.renterDate} onChange={v => update('signatures', 'renterDate', v)} />
            </div>
            <div className="space-y-6">
              <h4 className="font-bold text-forestGreen uppercase text-sm border-b border-forestGreen pb-1">Company Representative</h4>
              <InputLine label="Printed Name" value={data.signatures.companyRepName} onChange={v => update('signatures', 'companyRepName', v)} />
              <InputLine label="Title" value={data.signatures.companyRepTitle} onChange={v => update('signatures', 'companyRepTitle', v)} />
              <InputLine label="Signature" value={data.signatures.companyRepSig} onChange={v => update('signatures', 'companyRepSig', v)} className="font-script text-xl" />
              <InputLine label="Date" value={data.signatures.companyRepDate} onChange={v => update('signatures', 'companyRepDate', v)} />
            </div>
          </div>
        </Section>

        <div className="page-break"></div>

        {/* ADDENDUM A */}
        <Section title="Vehicle Condition Documentation" number="ADDENDUM A">
          <p className="mb-4 font-bold text-sm">Pre-Rental Inspection Checklist</p>
          <div className="border border-charcoal text-xs">
            <div className="hidden md:grid grid-cols-12 bg-gray-100 font-bold border-b border-charcoal p-1">
              <div className="col-span-3">Area</div>
              <div className="col-span-5">Condition</div>
              <div className="col-span-4">Notes</div>
            </div>
            {['Front Bumper', 'Rear Bumper', 'Driver Side', 'Passenger Side', 'Hood', 'Roof', 'Trunk/Hatch', 'Windshield', 'Rear Window', 'Side Mirrors', 'Tires', 'Interior', 'Headlights/Taillights', 'AC/Heater'].map((area, i) => {
               return (
                <div key={i} className="flex flex-col md:grid md:grid-cols-12 border-b border-gray-200 p-2 md:p-1 md:items-center gap-2 md:gap-0">
                  <div className="col-span-3 font-bold border-b md:border-none pb-1 md:pb-0">{area}</div>
                  <div className="col-span-5 flex gap-4 md:gap-2 justify-between md:justify-start">
                    <label className="flex items-center gap-1"><input type="checkbox" /> Good</label>
                    <label className="flex items-center gap-1"><input type="checkbox" /> Fair</label>
                    <label className="flex items-center gap-1"><input type="checkbox" /> Damaged</label>
                  </div>
                  <div className="col-span-4">
                     <input type="text" placeholder="Notes" className="w-full bg-transparent border-b border-gray-300 placeholder-gray-400" />
                  </div>
                </div>
               );
            })}
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between text-sm gap-4">
             <div className="flex flex-wrap gap-4 items-center">
               <span className="font-bold">Photos attached:</span>
               <label><input type="checkbox" checked={data.condition.photosTaken} onChange={() => update('condition', 'photosTaken', true)}/> Yes</label>
               <label><input type="checkbox" checked={!data.condition.photosTaken} onChange={() => update('condition', 'photosTaken', false)}/> No</label>
               <span>Count: <input type="text" className="w-12 border-b border-charcoal text-center" value={data.condition.photoCount} onChange={e => update('condition', 'photoCount', e.target.value)} /></span>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
                <span className="flex-1 md:flex-none">Renter Init: <input type="text" className="w-12 border-b border-charcoal" /></span>
                <span className="flex-1 md:flex-none">Rep Init: <input type="text" className="w-12 border-b border-charcoal" /></span>
             </div>
          </div>
        </Section>

        {/* ADDENDUM B */}
        <Section title="Authorized Additional Drivers" number="ADDENDUM B">
          <p className="text-sm mb-4">No person other than the Renter may operate the Vehicle unless listed below.</p>
          <div className="grid grid-cols-1 gap-6">
            <div className="border p-4 rounded bg-gray-50">
              <p className="font-bold text-forestGreen mb-2">Additional Driver #1</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InputLine label="Name" value={data.additionalDrivers.d1Name} onChange={v => update('additionalDrivers', 'd1Name', v)} />
                <InputLine label="DOB" value={data.additionalDrivers.d1Dob} onChange={v => update('additionalDrivers', 'd1Dob', v)} />
                <InputLine label="DL No." value={data.additionalDrivers.d1Dl} onChange={v => update('additionalDrivers', 'd1Dl', v)} />
                <InputLine label="Relationship" value={data.additionalDrivers.d1Rel} onChange={v => update('additionalDrivers', 'd1Rel', v)} />
                <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                   <div className="flex gap-2">
                     <span className="font-bold">Insurance Verified:</span>
                     <label><input type="checkbox" /> Yes</label>
                     <label><input type="checkbox" /> No</label>
                   </div>
                   <InputLine label="Signature" width="w-full md:w-64" value={data.additionalDrivers.d1Sig} onChange={v => update('additionalDrivers', 'd1Sig', v)} />
                </div>
              </div>
            </div>
            
            <div className="border p-4 rounded bg-gray-50">
              <p className="font-bold text-forestGreen mb-2">Additional Driver #2</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InputLine label="Name" value={data.additionalDrivers.d2Name} onChange={v => update('additionalDrivers', 'd2Name', v)} />
                <InputLine label="DOB" value={data.additionalDrivers.d2Dob} onChange={v => update('additionalDrivers', 'd2Dob', v)} />
                <InputLine label="DL No." value={data.additionalDrivers.d2Dl} onChange={v => update('additionalDrivers', 'd2Dl', v)} />
                <InputLine label="Relationship" value={data.additionalDrivers.d2Rel} onChange={v => update('additionalDrivers', 'd2Rel', v)} />
                <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                   <div className="flex gap-2">
                     <span className="font-bold">Insurance Verified:</span>
                     <label><input type="checkbox" /> Yes</label>
                     <label><input type="checkbox" /> No</label>
                   </div>
                   <InputLine label="Signature" width="w-full md:w-64" value={data.additionalDrivers.d2Sig} onChange={v => update('additionalDrivers', 'd2Sig', v)} />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* FEE SCHEDULE */}
        <div className="mt-8 mb-12 avoid-break">
          <div className="bg-lightGray border-2 border-forestGreen p-4 md:p-6 rounded shadow-sm">
             <h3 className="text-lg md:text-xl font-bold font-sans text-forestGreen uppercase text-center mb-4 tracking-wider">Fee Schedule Summary</h3>
             <table className="w-full text-xs md:text-sm font-serif">
               <tbody>
                  {[
                    ['Late Payment Fee', '$20.00/day (after 3-day grace)'],
                    ['Returned/Declined Payment', '$50.00'],
                    ['Geographic Violation (Leaving TX)', '$250.00'],
                    ['GPS/VSRS Tampering', '$500.00'],
                    ['Vehicle Recovery Admin Fee', '$150.00'],
                    ['Smoking/Substance Cleaning', '$250.00'],
                    ['Unauthorized Pet Cleaning', '$150.00'],
                    ['Late Return Surcharge', '1.5x daily rate/day'],
                    ['Fuel Replacement', '$4.50/gallon'],
                    ['Excessive Cleaning Fee', '$75.00 – $250.00'],
                    ['Unauthorized Repair Penalty', 'Actual cost + $100.00']
                  ].map(([label, cost], i) => (
                    <tr key={i} className="border-b border-gray-300 last:border-0">
                      <td className="py-2 font-bold text-charcoal pr-2">{label}</td>
                      <td className="py-2 text-right font-mono text-alertRed font-bold whitespace-nowrap">{cost}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-gray-300">
           <p className="font-bold text-forestGreen italic text-base md:text-lg mb-2">"We look forward to providing you with excellent service"</p>
           <p className="text-xs md:text-sm text-gray-500">Triple J Auto Investment LLC | 8774 Almeda Genoa Road, Houston, TX 77075</p>
        </div>

      </div>
    </div>
  );
};

export default App;