import { paraNumero } from './numeros.js'

export function calcularIMC(peso, altura) {
  const pesoNum = paraNumero(peso)
  const alturaNum = paraNumero(altura)
  const alturaM = alturaNum > 3 ? alturaNum / 100 : alturaNum
  return pesoNum / (alturaM * alturaM)
}

export function classificarIMC(imc) {
  if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'text-amber-600' }
  if (imc < 25) return { texto: 'Peso normal', cor: 'text-emerald-600' }
  if (imc < 30) return { texto: 'Sobrepeso', cor: 'text-orange-500' }
  return { texto: 'Obesidade', cor: 'text-rose-600' }
}

export function getExplicacaoIMC(imc) {
  if (imc < 18.5) {
    return 'Seu IMC indica que você está abaixo do peso. Cada corpo é único, mas vale a pena prestar atenção na sua alimentação e saúde.'
  }
  if (imc < 25) {
    return 'Seu IMC está dentro da faixa considerada normal pela OMS. Ótimo ponto de partida pra ganhar força com esse treino.'
  }
  if (imc < 30) {
    return 'Seu IMC indica sobrepeso. Com constância nos treinos e bons hábitos, já é possível ver bons resultados aos poucos.'
  }
  return 'Seu IMC indica obesidade. O mais importante agora é começar aos poucos e manter a constância. Qualquer passo já conta.'
}
