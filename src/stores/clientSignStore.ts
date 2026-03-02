import { createContext, useContext } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgreementData } from '../types'

/**
 * State shape for the client-side signing wizard.
 * Only covers the sections the client fills — admin-filled fields live in the fetched agreement.
 */
export interface ClientSignState {
  // Wizard navigation
  step: number // 0-5: 0=Review, 1=Personal, 2=Employment, 3=Emergency, 4=Sign, 5=Review+Confirm

  // Client-fillable agreement data (partial — only sections the client completes)
  clientData: Partial<AgreementData>

  // Signature capture
  drawnSignature: string      // base64 dataURL from signature canvas
  drawnInitials: string       // base64 dataURL from initials canvas (drawn once, applied to all sections)
  signatureType: 'draw' | 'type'
  typedSignatureName: string  // Name typed for typed signature alternative (SIGN-03)

  // Acknowledgment sections that have been initialed (draw-once, apply pattern)
  acknowledgedSections: string[]

  // Agreement metadata (set after fetching by token)
  agreementId: string | null
  agreementNumber: string | null

  // Actions
  setStep: (step: number) => void
  updateClientField: (section: keyof AgreementData, field: string, value: unknown) => void
  setDrawnSignature: (dataUrl: string) => void
  setDrawnInitials: (dataUrl: string) => void
  setSignatureType: (type: 'draw' | 'type') => void
  setTypedSignatureName: (name: string) => void
  toggleAcknowledgment: (sectionKey: string) => void
  setAgreementMeta: (id: string, number: string) => void
  reset: () => void
}

const initialState: Omit<ClientSignState,
  'setStep' | 'updateClientField' | 'setDrawnSignature' | 'setDrawnInitials' |
  'setSignatureType' | 'setTypedSignatureName' | 'toggleAcknowledgment' |
  'setAgreementMeta' | 'reset'
> = {
  step: 0,
  clientData: {},
  drawnSignature: '',
  drawnInitials: '',
  signatureType: 'draw',
  typedSignatureName: '',
  acknowledgedSections: [],
  agreementId: null,
  agreementNumber: null,
}

/**
 * Factory function that creates a Zustand persist store keyed to a specific token.
 * Different agreements get separate localStorage entries — tokens never collide.
 *
 * Pattern: `tj-sign-{token}` — unique per agreement per device.
 * Returns from same store on re-render (Zustand deduplicates by store name).
 */
export function createClientSignStore(token: string) {
  return create<ClientSignState>()(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ step }),

        updateClientField: (section, field, value) =>
          set((state) => ({
            clientData: {
              ...state.clientData,
              [section]: {
                ...(state.clientData[section] as Record<string, unknown> | undefined ?? {}),
                [field]: value,
              },
            },
          })),

        setDrawnSignature: (dataUrl) => set({ drawnSignature: dataUrl }),

        setDrawnInitials: (dataUrl) => set({ drawnInitials: dataUrl }),

        setSignatureType: (type) => set({ signatureType: type }),

        setTypedSignatureName: (name) => set({ typedSignatureName: name }),

        toggleAcknowledgment: (sectionKey) =>
          set((state) => {
            const already = state.acknowledgedSections.includes(sectionKey)
            return {
              acknowledgedSections: already
                ? state.acknowledgedSections.filter((k) => k !== sectionKey)
                : [...state.acknowledgedSections, sectionKey],
            }
          }),

        setAgreementMeta: (id, number) =>
          set({ agreementId: id, agreementNumber: number }),

        reset: () => set({ ...initialState }),
      }),
      {
        name: `tj-sign-${token}`, // token-scoped localStorage key
      }
    )
  )
}

/**
 * React context for passing the per-token store down the wizard component tree.
 * Avoids prop drilling through ClientSign → WizardStep → sub-components.
 */
export const ClientSignStoreContext = createContext<ReturnType<typeof createClientSignStore> | null>(null)

/**
 * Hook for wizard step components to access the client sign store.
 * Must be used within a ClientSignStoreContext.Provider.
 */
export function useClientSignStore<T>(selector: (state: ClientSignState) => T): T {
  const store = useContext(ClientSignStoreContext)
  if (!store) {
    throw new Error('useClientSignStore must be used within a ClientSignStoreContext.Provider')
  }
  return store(selector)
}
