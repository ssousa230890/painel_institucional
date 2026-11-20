# Memento: atualização de autoridades do painel

Referência registrada em 09/11/2026.

## Ambiente confirmado

- Servidor: `10.133.141.59` (Linux, hostname `painelbadmapcmp`).
- Usuário: `dti`.
- Pasta de preparação dos arquivos no servidor: `/home/dti/painel_base`.
- **Pasta da aplicação em execução: `/opt/painel_base`.**
- Serviço systemd: `painel_base.service`.
- Backend: `/usr/bin/node /opt/painel_base/server.js`, porta `3000`.
- O processo identificado não usa PM2.
- Projeto local no Windows: `C:\Users\ssous\Desktop\painel_base`.

Alterar apenas `/home/dti/painel_base` e reiniciar o servidor não atualiza a cópia em `/opt/painel_base`.

## Autoridades configuradas nesta atualização

| Cargo | Nome | Posto no código | Foto |
| --- | --- | --- | --- |
| Comandante | Wagner Bispo | Cel | wagner-bispo.jpg |
| SCmt | James | Maj | james.jpg |
| Adjunto de Comando | Souza | S Ten | souza.jpg |

James substituiu Sales; Souza substituiu Linck. Os nomes e cargos podem mudar em atualizações futuras.

## O que alterar no projeto

1. `routes/autoridades.js`: lista `AUTHORITY_ROSTER`, mapa `DEFAULT_AUTHORITY_PHOTOS` e função `ensureAuthorityRoster()`.
2. `routes/public.js`: mesmos pontos para os dados do painel público, incluindo o fluxo em tempo real.
3. `sql/init.sql`: cadastros iniciais e atualizações para manter a instalação do banco coerente.
4. `public/autoridades/`: fotos, com nomes exatamente iguais aos configurados, incluindo maiúsculas/minúsculas e extensão.

Ao trocar uma pessoa, conferir nome, chave normalizada, posto, cargo, ordem e foto. Adaptar a migração do cadastro anterior, evitando duplicar a pessoa quando o novo cadastro já existir. Não reutilizar a foto da pessoa anterior. Conferir também se algum comando de limpeza exclui a nova autoridade.

As rotas atuais sincronizam esses cadastros ao serem consultadas. Para esta troca não é necessário executar todo o `sql/init.sql`, alterar o `.env` ou recompilar o frontend.

## Aplicar no Linux

Primeiro, transfira os arquivos atualizados do computador para `/home/dti/painel_base` no servidor. Os comandos abaixo são executados **no terminal Linux do servidor**.

### 1. Conferir os arquivos recebidos

```bash
cd /home/dti/painel_base
grep -nE 'James|Souza' routes/autoridades.js routes/public.js
ls -l public/autoridades/{james,souza}.jpg
node --check routes/autoridades.js
node --check routes/public.js
```

Em futuras trocas, ajuste os nomes e os arquivos dos comandos.

### 2. Fazer backup da versão em execução

```bash
backup_dir="/home/dti/painel_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
sudo cp -a /opt/painel_base/routes "$backup_dir/routes"
sudo cp -a /opt/painel_base/public/autoridades "$backup_dir/autoridades"
echo "Backup: $backup_dir"
```

Este backup contém os arquivos; não contém o banco de dados.

### 3. Copiar para a pasta usada pelo serviço

```bash
sudo cp /home/dti/painel_base/routes/{autoridades,public}.js /opt/painel_base/routes/
sudo cp /home/dti/painel_base/public/autoridades/{james,souza}.jpg /opt/painel_base/public/autoridades/
```

Se `sql/init.sql` também foi atualizado, mantenha a cópia do servidor sincronizada, sem executar o script completo:

```bash
sudo cp /home/dti/painel_base/sql/init.sql /opt/painel_base/sql/init.sql
```

### 4. Reiniciar o serviço correto

```bash
sudo systemctl restart painel_base
sudo systemctl status painel_base --no-pager
```

Quando o `sudo` pedir a senha, digite a senha do usuário Linux e pressione Enter. Nenhum caractere aparece durante a digitação.

### 5. Validar a resposta e as fotos

```bash
curl -fsS --max-time 10 http://localhost:3000/autoridades
curl -fsS --max-time 10 http://localhost:3000/public/painel
curl -I --max-time 10 http://localhost:3000/midia/autoridades/james.jpg
curl -I --max-time 10 http://localhost:3000/midia/autoridades/souza.jpg
```

As duas respostas de dados devem conter James como Maj e Souza como S Ten. As fotos devem retornar HTTP `200`. Depois, atualize o navegador com **Ctrl + F5**.

## Diagnóstico se continuar mostrando dados antigos

```bash
grep -nE 'James|Souza' /opt/painel_base/routes/autoridades.js /opt/painel_base/routes/public.js
ps -eo pid,args | grep -E '[n]ode|[n]pm'
sudo systemctl cat painel_base
sudo journalctl -u painel_base -n 50 --no-pager
```

- Se a API local mostra os nomes antigos, confira os arquivos em `/opt/painel_base` e se o serviço foi reiniciado com sucesso.
- Se a API local mostra os novos nomes, mas o navegador mostra os antigos, confira o endereço da API usado pelo frontend e o destino do proxy, caso exista. O frontend pode usar `VITE_API_URL` ou a origem do próprio painel.
- Se os nomes estão corretos e as fotos falham, confira os arquivos em `/opt/painel_base/public/autoridades`, seus nomes e suas permissões de leitura.
- Foi observado um erro histórico `ECONNREFUSED 127.0.0.1:3306` na inicialização. Isso não confirma falha atual: confira os logs recentes. As rotas têm dados de reserva, portanto nomes corretos na resposta, por si só, não comprovam conexão com o banco.

Na conversa que originou este documento, os arquivos e as fotos foram confirmados em `/home/dti/painel_base` e a cópia para `/opt/painel_base` foi executada sem erro exibido. O comando de reinicialização foi fornecido, mas sua execução e a validação final ainda não foram confirmadas pelo usuário.
