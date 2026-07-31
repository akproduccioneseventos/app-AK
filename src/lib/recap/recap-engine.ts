export function generateMorningRecapContext(fiesta: any, posts: any[], songs: any[], trivia: any[]): string {
  return `
Contexto para IA:
Fiesta ID: ${fiesta?.id}
Posts totales: ${posts?.length || 0}
Canciones solicitadas: ${songs?.length || 0}
Preguntas de trivia jugadas: ${trivia?.length || 0}
  `;
}

export const DUMMY_RECAP = {
  title: "¡La Noche Inolvidable!",
  sections: [
    {
      title: "Escándalo en la mesa 4",
      content: "Fuentes cercanas (y varios videos comprometedores) confirman que la coreografía improvisada de anoche pasará a la historia. La energía estuvo por las nubes y nadie se quedó sentado en toda la noche."
    },
    {
      title: "La foto del siglo",
      content: "Entre risas y flashes, se capturó el momento perfecto. Los invitados demostraron ser los más fotogénicos de la temporada, dejando anécdotas que se contarán por años y años."
    },
    {
      title: "El veredicto de la trivia",
      content: "Hubo de todo: sorpresas, empates técnicos y algunos reclamos divertidos al juez. Quedó claro quiénes son los que realmente conocen a los homenajeados y quiénes venían solo por la comida."
    }
  ],
  footer: "Gracias por hacer de esta celebración un evento de primera plana."
};
