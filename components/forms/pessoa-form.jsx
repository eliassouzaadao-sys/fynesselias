"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function PessoaSelect({ value, onChange, onAdd, disabled }) {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pessoas")
      .then((res) => res.json())
      .then((data) => {
        setPessoas(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* <label className="text-sm font-medium text-fyn-text">Pessoa/Beneficiário</label> */}
      <Select value={value} onValueChange={onChange} disabled={loading || disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma pessoa" />
        </SelectTrigger>
        <SelectContent>
          {pessoas.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
          ))}
          <div className="border-t my-1" />
          <SelectItem value="nova" className="text-fyn-accent font-semibold flex items-center gap-2">
            <span style={{fontWeight:600, color:'#2563eb'}}>+ Nova pessoa</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PessoaForm({ onSave, onCancel }) {
  // ...existing code...
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/pessoas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, contato, chavePix, banco, agencia, contaBancaria, tipoConta, observacoes }),
    });
    const pessoa = await res.json();
    setLoading(false);
    onSave(pessoa);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} required />
      <Input placeholder="Contato (telefone ou e-mail)" value={contato} onChange={e => setContato(e.target.value)} />
      <Input placeholder="Chave Pix" value={chavePix} onChange={e => setChavePix(e.target.value)} />
      <Input placeholder="Banco" value={banco} onChange={e => setBanco(e.target.value)} />
      <Input placeholder="Agência" value={agencia} onChange={e => setAgencia(e.target.value.replace(/\D/g, ''))} maxLength={6} />
      <Input placeholder="Conta bancária" value={contaBancaria} onChange={e => setContaBancaria(e.target.value.replace(/\D/g, ''))} maxLength={12} />
      <div>
        <label className="text-sm font-medium text-fyn-text">Tipo de conta</label>
        <select
          className="w-full rounded-md border border-fyn-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fyn-accent"
          value={tipoConta}
          onChange={e => setTipoConta(e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="corrente">Corrente</option>
          <option value="poupança">Poupança</option>
          <option value="salário">Salário</option>
          <option value="pagamento">Pagamento</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <Input placeholder="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
