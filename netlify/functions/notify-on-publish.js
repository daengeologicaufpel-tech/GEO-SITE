// Importa o cliente do SendGrid
const sgMail = require('@sendgrid/mail');
// Importa o fetch para fazer requisições HTTP
const fetch = require('node-fetch');

// Configura o SendGrid com a API Key que guardamos na Netlify
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// A função principal que será executada pela Netlify
exports.handler = async function(event, context) {
    // Informações do seu repositório no GitHub
    const GITHUB_USER = 'daengeologicaufpel-tech';
    const GITHUB_REPO = 'GEO-SITE';
    const POSTS_PATH = '_posts';

    try {
        // 1. Busca o post mais recente no GitHub
        const postsUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${POSTS_PATH}`;
        const postsResponse = await fetch(postsUrl);
        const postsFiles = await postsResponse.json();
        
        if (!Array.isArray(postsFiles)) {
            throw new Error('Não foi possível buscar a lista de posts.');
        }

        // Ordena os arquivos para encontrar o mais recente pelo nome (data)
        postsFiles.sort((a, b) => b.name.localeCompare(a.name));
        const latestPostFile = postsFiles[0];

        // Busca o conteúdo do post mais recente
        const postContentResponse = await fetch(latestPostFile.download_url);
        const markdownContent = await postContentResponse.text();
        const postData = parseFrontmatter(markdownContent);
        
        // 2. Busca a lista de usuários cadastrados na Netlify
        const usersUrl = `${process.env.URL}/.netlify/identity/admin/users`;
        const adminAuthToken = context.clientContext.identity.token;
        
        const usersResponse = await fetch(usersUrl, {
            headers: { 'Authorization': `Bearer ${adminAuthToken}` }
        });
        const userData = await usersResponse.json();
        const users = userData.users;

        if (!users || users.length === 0) {
            console.log("Nenhum usuário para notificar.");
            return { statusCode: 200, body: "Nenhum usuário para notificar." };
        }

        // 3. Prepara e envia os e-mails
        const emailSubject = `Novo Post no DAFPO: ${postData.title}`;
        const emailHtml = `
            <h1>${postData.title}</h1>
            <p>${postData.excerpt}</p>
            <p><a href="${process.env.URL}">Leia mais no site</a></p>
            <img src="${postData.thumbnail.startsWith('http') ? postData.thumbnail : process.env.URL + postData.thumbnail}" alt="Imagem do Post" style="max-width: 100%;"/>
        `;

        const msg = {
            to: users.map(user => user.email), // Envia para todos os usuários
            from: 'diretorioengeologica@gmail.com', // SEU E-MAIL VERIFICADO NO SENDGRID
            subject: emailSubject,
            html: emailHtml,
        };

        await sgMail.sendMultiple(msg);
        
        console.log(`${users.length} e-mails enviados com sucesso.`);
        return { statusCode: 200, body: `${users.length} e-mails enviados com sucesso.` };

    } catch (error) {
        console.error('Erro ao executar a função:', error);
        return { statusCode: 500, body: `Erro: ${error.message}` };
    }
};

// Função auxiliar para extrair dados do cabeçalho do arquivo
function parseFrontmatter(markdownContent) {
    const match = markdownContent.match(/---([\s\S]*?)---/);
    if (!match) return {};
    const frontmatter = {};
    const lines = match[1].trim().split('\n');
    lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
        frontmatter[key.trim()] = value;
    });
    return frontmatter;
}