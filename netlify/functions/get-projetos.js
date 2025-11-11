import fetch from 'node-fetch';

const PROJETOS_API_URL = 'https://institucional.ufpel.edu.br/projetos/lista';
const FILTRO_PAYLOAD = 'termo=&tipo=&situacao=&unidade=&servidor=&curso=5600&ano_inicio=&ano_fim=&ods=';

export async function handler(event, context) {
    try {
        const response = await fetch(PROJETOS_API_URL, {
            method: 'POST',
            
            // --- O DISFARCE (AGORA COMPLETO) ---
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                // ESTA É A NOVA LINHA MÁGICA
                'Referer': 'https://institucional.ufpel.edu.br/projetos' 
            },
            // --- FIM DO DISFARCE ---

            body: FILTRO_PAYLOAD
        });

        if (!response.ok) {
            throw new Error(`Falha na API da UFPel: ${response.statusText}`);
        }

        const jsonResponse = await response.json();
        
        const projectsData = jsonResponse.dados || [];

        const allProjects = projectsData.map(proj => {
            return {
                title: proj.titulo,
                coordenador: proj.servidor_nome,
                body: proj.resumo || 'Resumo não disponível.'
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(allProjects)
        };

    } catch (error)
    {
        console.error('Erro na Netlify Function:', error);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: 'Falha ao buscar dados da UFPel.' })
        };
    }
}
