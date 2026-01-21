"use client"

import { createContext, useContext, useState } from "react"

const mockCompanies = [
  { _id: "1", name: "Tech Solutions ME", cnpj: "12.345.678/0001-01", type: "ME" },
  { _id: "2", name: "Comércio ABC EPP", cnpj: "98.765.432/0001-02", type: "EPP" },
  { _id: "3", name: "Serviços XYZ ME", cnpj: "45.678.901/0001-03", type: "ME" },
]

const CompanyContext = createContext({
  companies: [],
  selectedCompany: null,
  setSelectedCompany: () => {},
  loading: false,
})

export function CompanyProvider({ children }) {
  const [companies] = useState(mockCompanies)
  const [selectedCompany, setSelectedCompanyState] = useState(mockCompanies[0])

  function setSelectedCompany(company) {
    setSelectedCompanyState(company)
  }

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, loading: false }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  return useContext(CompanyContext)
}
