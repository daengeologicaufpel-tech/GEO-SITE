// Importa o 'fetch' para fazer a "ligação"
import fetch from 'node-fetch';

// A "Mina de Ouro" que VOCÊ descobriu: a API de busca de projetos
const PROJETOS_API_URL = 'https://institucional.ufpel.edu.br/projetos/lista';

// O "filtro" que vamos enviar para a API:
// Nós queremos apenas projetos do curso de "Engenharia Geológica" (código 5600)
const FILTRO_PAYLOAD = 'termo=&tipo=&situacao=&unidade=&servidor=&curso=5600&ano_inicio=&ano_fim=&ods=';

export async function handler(event, context) {
    try {
        // 1. Fazer a "ligação" (POST) para a API da UFPel com o nosso filtro
        const response = await fetch(PROJETOS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: FILTRO_PAYLOAD
        });

        if (!response.ok) {
            throw new Error(`Falha na API da UFPel: ${response.statusText}`);
        }

        const jsonResponse = await response.json();
        
        // 2. A API devolve os projetos dentro de um campo chamado "dados"
        const projectsData = jsonResponse.dados || [];

        // 3. Formatar os dados para o nosso site
        const allProjects = projectsData.map(proj => {
            return {
                title: proj.titulo,                // Nome correto: 'titulo'
                coordenador: proj.servidor_nome,   // Nome correto: 'servidor_nome'
                body: proj.resumo || 'Resumo não disponível.' // Nome correto: 'resumo'
            };
        });

        // 4. Enviar a lista formatada para o nosso site
        return {
            statusCode: 200,
            body: JSON.stringify(allProjects)
        };

    } catch (error)
    {
        console.error('Erro na Netlify Function:', error);
        return {
            statusCode: 502, // 502 Bad Gateway (erro ao "ligar" para outro servidor)
            body: JSON.stringify({ error: 'Falha ao buscar dados da UFPel.' })
        };
    }
}