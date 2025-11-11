// Importa o 'fetch'
import fetch from 'node-fetch';

// A API de busca de projetos
const PROJETOS_API_URL = 'https://institucional.ufpel.edu.br/projetos/lista';

// O filtro (payload) para o curso 5600 (Eng. Geológica)
const FILTRO_PAYLOAD = 'termo=&tipo=&situacao=&unidade=&servidor=&curso=5600&ano_inicio=&ano_fim=&ods=';

export async function handler(event, context) {
    try {
        // 1. Fazer a "ligação" (POST) para a API da UFPel
        const response = await fetch(PROJETOS_API_URL, {
            method: 'POST',
            
            // --- O DISFARCE (A CORREÇÃO) ---
            // Nós fingimos ser um navegador Chrome real
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            // --- FIM DO DISFARCE ---

            body: FILTRO_PAYLOAD
        });

        // Se a UFPel ainda assim não gostar, o erro vai acontecer aqui
        if (!response.ok) {
            throw new Error(`Falha na API da UFPel: ${response.statusText}`);
        }

        // Tenta ler a resposta como JSON
        const jsonResponse = await response.json();
        
        // 2. A API devolve os projetos dentro de um campo chamado "dados"
        const projectsData = jsonResponse.dados || [];

        // 3. Formatar os dados para o nosso site
        const allProjects = projectsData.map(proj => {
            return {
                title: proj.titulo,
                coordenador: proj.servidor_nome,
                body: proj.resumo || 'Resumo não disponível.'
            };
        });

        // 4. Enviar a lista formatada para o nosso site
        return {
            statusCode: 200,
            body: JSON.stringify(allProjects)
        };

    } catch (error)
    {
        // Se o erro "Unexpected token <" acontecer DE NOVO,
        // ele vai ser pego aqui.
        console.error('Erro na Netlify Function:', error);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: 'Falha ao buscar dados da UFPel.' })
        };
    }
}
