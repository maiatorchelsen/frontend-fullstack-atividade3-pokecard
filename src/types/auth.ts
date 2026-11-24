export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

export interface DadosRegistro extends CredenciaisLogin {
  nome: string;
}

export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}
