
import React from 'react';

export const BRAND = { 
  name: 'VANTA', 
  slogan: 'ESTILO DE VIDA É ACESSO.', 
  primary: '#8b5cf6', 
  gold: '#d4af37' 
};

export const BRAZIL_STATES = [
  { sigla: 'AC', nome: 'Acre', cidades: ['Rio Branco', 'Cruzeiro do Sul'] },
  { sigla: 'AL', nome: 'Alagoas', cidades: ['Maceió', 'Arapiraca'] },
  { sigla: 'AP', nome: 'Amapá', cidades: ['Macapá', 'Santana'] },
  { sigla: 'AM', nome: 'Amazonas', cidades: ['Manaus', 'Itacoatiara'] },
  { sigla: 'BA', nome: 'Bahia', cidades: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Trancoso'] },
  { sigla: 'CE', nome: 'Ceará', cidades: ['Fortaleza', 'Caucaia', 'Jericoacoara'] },
  { sigla: 'DF', nome: 'Distrito Federal', cidades: ['Brasília'] },
  { sigla: 'ES', nome: 'Espírito Santo', cidades: ['Vitória', 'Vila Velha', 'Guarapari'] },
  { sigla: 'GO', nome: 'Goiás', cidades: ['Goiânia', 'Aparecida de Goiânia', 'Pirenópolis'] },
  { sigla: 'MA', nome: 'Maranhão', cidades: ['São Luís', 'Imperatriz'] },
  { sigla: 'MT', nome: 'Mato Grosso', cidades: ['Cuiabá', 'Várzea Grande'] },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', cidades: ['Campo Grande', 'Dourados'] },
  { sigla: 'MG', nome: 'Minas Gerais', cidades: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Ouro Preto'] },
  { sigla: 'PA', nome: 'Pará', cidades: ['Belém', 'Ananindeua'] },
  { sigla: 'PB', nome: 'Paraíba', cidades: ['João Pessoa', 'Campina Grande'] },
  { sigla: 'PR', nome: 'Paraná', cidades: ['Curitiba', 'Londrina', 'Maringá'] },
  { sigla: 'PE', nome: 'Pernambuco', cidades: ['Recife', 'Olinda', 'Porto de Galinhas'] },
  { sigla: 'PI', nome: 'Piauí', cidades: ['Teresina', 'Parnaíba'] },
  { sigla: 'RJ', nome: 'Rio de Janeiro', cidades: ['Rio de Janeiro', 'Niterói', 'Búzios', 'Angra dos Reis'] },
  { sigla: 'RN', nome: 'Rio Grande do Norte', cidades: ['Natal', 'Mossoró', 'Pipa'] },
  { sigla: 'RS', nome: 'Rio Grande do Sul', cidades: ['Porto Alegre', 'Caxias do Sul', 'Gramado'] },
  { sigla: 'RO', nome: 'Rondônia', cidades: ['Porto Velho', 'Ji-Paraná'] },
  { sigla: 'RR', nome: 'Roraima', cidades: ['Boa Vista'] },
  { sigla: 'SC', nome: 'Santa Catarina', cidades: ['Florianópolis', 'Balneário Camboriú', 'Joinville', 'Itajaí'] },
  { sigla: 'SP', nome: 'São Paulo', cidades: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos'] },
  { sigla: 'SE', nome: 'Sergipe', cidades: ['Aracaju'] },
  { sigla: 'TO', nome: 'Tocantins', cidades: ['Palmas'] }
];

export const ICONS = {
  Home: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Explore: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Calendar: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  User: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MapPin: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Plus: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Search: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Message: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
  ArrowLeft: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Star: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  Edit: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Shield: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Crown: (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
};
