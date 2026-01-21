"use client"

import { useCompany } from "@/lib/company-context"
import { useState } from "react"

export function EmpresasContent() {
  const { companies, selectedCompany, setSelectedCompany } = useCompany()
  const [showSocios, setShowSocios] = useState(false)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Empresas</h1>
      <div className="flex gap-4">
        <div className="w-64 border-r pr-4">
          <h2 className="text-lg font-medium mb-2">Lista de Empresas</h2>
          <ul className="space-y-1">
            {companies.map((c) => (
              <li key={c._id}>
                <button
                  className={`w-full text-left px-2 py-1 rounded ${selectedCompany?._id === c._id ? "bg-fyn-primary text-white" : "hover:bg-fyn-surface"}`}
                  onClick={() => setSelectedCompany(c)}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          {selectedCompany && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedCompany.name}</h2>
                <div className="text-sm text-fyn-text-muted">CNPJ: {selectedCompany.cnpj} | Tipo: {selectedCompany.type}</div>
              </div>
              <button
                className="text-fyn-accent underline text-sm"
                onClick={() => setShowSocios((v) => !v)}
              >
                {showSocios ? "Ocultar Sócios" : "Gerenciar Sócios"}
              </button>
              {showSocios && <SociosSection empresaId={selectedCompany._id} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SociosSection({ empresaId }) {
  // Mock de sócios por empresa
  const [socios, setSocios] = useState([
    { id: 1, nome: "João Silva", cpf: "123.456.789-00", percentual: 60 },
    { id: 2, nome: "Maria Souza", cpf: "987.654.321-00", percentual: 40 },
  ])
  const [novo, setNovo] = useState({ nome: "", cpf: "", percentual: "" })

  function adicionarSocio() {
    if (!novo.nome || !novo.cpf || !novo.percentual) return
    setSocios([...socios, { ...novo, id: Date.now() }])
    setNovo({ nome: "", cpf: "", percentual: "" })
  }

  function removerSocio(id) {
    setSocios(socios.filter((s) => s.id !== id))
  }

  return (
    <div className="border rounded p-4 bg-fyn-bg space-y-4">
      <h3 className="font-medium mb-2">Sócios da Empresa</h3>
      <table className="min-w-full text-sm mb-2">
        <thead>
          <tr>
            <th className="text-left px-2 py-1">Nome</th>
            <th className="text-left px-2 py-1">CPF</th>
            <th className="text-right px-2 py-1">% Participação</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {socios.map((s) => (
            <tr key={s.id}>
              <td className="px-2 py-1">{s.nome}</td>
              <td className="px-2 py-1">{s.cpf}</td>
              <td className="px-2 py-1 text-right">{s.percentual}%</td>
              <td className="px-2 py-1 text-right">
                <button className="text-fyn-danger text-xs" onClick={() => removerSocio(s.id)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="CPF"
          value={novo.cpf}
          onChange={(e) => setNovo({ ...novo, cpf: e.target.value })}
        />
        <input
          className="border rounded px-2 py-1 text-sm w-20"
          placeholder="%"
          type="number"
          value={novo.percentual}
          onChange={(e) => setNovo({ ...novo, percentual: e.target.value })}
        />
        <button className="bg-fyn-primary text-white rounded px-3 py-1 text-sm" onClick={adicionarSocio}>
          Adicionar
        </button>
      </div>
    </div>
  )
}
