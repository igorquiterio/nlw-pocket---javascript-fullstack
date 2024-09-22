

<h1 align="center">nlw-pocket-server</h1>


---

<p align="center"> Backend do projeto do in.orbit para registrar metas semanais e ir acompanhando seu progresso
    <br>
</p>

## 🧐 About <a name = "about"></a>

Projeto de servidor em node.js utilizando [DrizzleORM](https://orm.drizzle.team/) para a comunicação com o banco de dados de PostgreSQL, [fastify](https://fastify.dev/) para gerenciamento de requests e
[zod](https://zod.dev/) para a validação de variáveis

## 🏁 Getting Started <a name = "getting_started"></a>

Essas instruções irão ajudá-lo a obter uma cópia do projeto em execução em sua máquina local para fins de desenvolvimento e testes.

### Prerequisites

- **Node.js** de preferencia rodando em alguma versão lts, é recomendado alguma ferramenta de versionamento como por exemplo [N](https://www.npmjs.com/package/n) ou o [NVM](https://github.com/nvm-sh/nvm).

- **postgreSQL** , dentro do projeto existe um arquivo docker-compose que pode ser executado para subir um container com postgreSQL em sua maquina, basta rodar o codigo ``` docker compose up ``` dentro da pasta do projeto, o comando só ira funcionar se você tiver o docker instalado e configurado na sua maquina é claro
