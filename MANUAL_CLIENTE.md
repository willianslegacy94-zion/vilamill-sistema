# Villa Mill Tamboré — Manual do Sistema

**Sistema de Gestão e PDV**  
Versão 1.1 · Maio 2026

---

## Bem-vindo ao sistema do Villa Mill Tamboré

Este sistema foi criado para facilitar o dia a dia do restaurante: abrir mesas, lançar pedidos, fechar contas, controlar o estoque e acompanhar as vendas do dia. Tudo em uma única tela, simples e direto.

---

## Como acessar

Abra o navegador e acesse: **https://villamill.online**

Você verá a tela de login. Insira seu **e-mail** e sua **senha** e clique em **Entrar**.

Se não souber sua senha, solicite ao administrador do sistema.

---

## Tipos de usuário

O sistema possui três tipos de acesso:

**Administrador**
Acesso completo. Pode usar todos os módulos, ver o faturamento do dia e o relatório financeiro completo.

**Caixa**
Acesso ao dia a dia operacional: mesas, cardápio e estoque. Não visualiza informações financeiras.

**Treinamento**
Acesso igual ao Caixa, porém nenhuma ação é salva. Ideal para treinar novos colaboradores sem risco. Uma faixa amarela aparece na parte superior da tela indicando que o sistema está em modo de treinamento.

---

## Tela inicial

Ao entrar no sistema, você verá os módulos disponíveis para o seu perfil e alguns indicadores rápidos:

- **Mesas abertas** — quantas mesas estão com pedido ativo no momento
- **Pedidos fechados** — quantas contas foram fechadas hoje
- **Faturamento do dia** — total recebido hoje *(visível apenas para Administrador)*

Se algum insumo do estoque estiver abaixo do nível mínimo, um alerta vermelho aparecerá na tela inicial.

---

## Módulo: Mesas

Este é o coração do sistema. Aqui você gerencia todas as mesas do restaurante.

### Como abrir uma mesa

1. Clique na mesa desejada (aparece em **verde** quando está livre)
2. Clique em **Abrir Mesa**
3. A mesa ficará marcada em vermelho como **Ocupada**

### Como adicionar itens ao pedido

Com a mesa aberta e o painel lateral visível:

1. Use o campo de **busca** para encontrar um produto pelo nome, ou navegue pelas **abas de categoria** (Pratos do Dia, Bebidas, etc.)
2. Clique no produto desejado para selecioná-lo — ele ficará destacado
3. Ajuste a **quantidade** no campo ao lado
4. Clique em **Adicionar**

O item aparecerá na lista da comanda com o valor calculado automaticamente.

### Como remover um item

Na lista de itens da comanda, clique em **Remover** ao lado do item desejado.

### Como aplicar desconto

No campo **Desconto R$**, digite o valor a ser descontado. O sistema mostrará o valor final automaticamente.

### Como fechar a conta

1. Selecione a **forma de pagamento**: Dinheiro, Crédito, Débito ou Pix
2. Clique em **Fechar Conta** — a conta fica como "aguardando pagamento" e a mesa continua registrada
3. Ou clique em **Fechar e Liberar Mesa** — registra o pagamento e já libera a mesa para novo uso

### Liberar mesa de emergência

Caso precise liberar uma mesa sem fechar a conta (ex: cliente foi embora sem pagar), use o botão **Liberar Mesa (emergência)**. A mesa voltará a ficar disponível.

### Cancelar e liberar mesa

Para cancelar todo o pedido de uma mesa e liberá-la, clique em **Cancelar e liberar mesa**. Você pode informar o motivo do cancelamento. Esse registro ficará salvo no sistema.

---

## Módulo: Cardápio

Aqui você pode visualizar e editar os produtos que aparecem no sistema.

### Visualizar produtos

Os produtos aparecem organizados por categoria. Você vê o nome e o preço de cada item.

### Adicionar produto *(apenas Administrador)*

1. Clique em **+ Novo Produto**
2. Preencha o nome, a categoria e o preço
3. Clique em **Salvar**

### Editar produto *(apenas Administrador)*

Clique em **Editar** ao lado do produto desejado, altere as informações e clique em **Salvar**.

### Excluir produto *(apenas Administrador)*

Clique em **Excluir** ao lado do produto. O sistema pedirá confirmação.

### Ficha Técnica *(apenas Administrador)*

A ficha técnica vincula ingredientes do estoque a um produto, definindo quanto de cada insumo é consumido por porção. Clique em **Ficha Técnica** ao lado de um produto para gerenciar os ingredientes.

---

## Módulo: Estoque

Aqui você acompanha os insumos do restaurante, registra entradas e saídas, e vê alertas quando algum item está acabando.

### Visualizar o estoque

A tabela mostra cada insumo com a quantidade atual, o nível mínimo e um indicador de status:
- **OK** → estoque suficiente
- **Alerta** → estoque igual ou abaixo do nível mínimo

### Registrar uma entrada (compra/reposição)

1. Clique em **Entrada** ao lado do insumo
2. Informe a quantidade recebida
3. Clique em **Confirmar Entrada**

O sistema somará automaticamente ao estoque atual.

### Registrar uma saída (uso avulso)

1. Clique em **Saída** ao lado do insumo
2. Informe a quantidade retirada
3. Clique em **Confirmar Saída**

### Adicionar, editar ou excluir insumos *(apenas Administrador)*

Use o botão **+ Novo Insumo** para cadastrar um novo item no estoque, ou os botões **Editar** e **Excluir** ao lado de cada insumo para gerenciar.

---

## Módulo: Financeiro *(apenas Administrador)*

O módulo financeiro mostra o desempenho de vendas no período selecionado.

### Filtro de período

No topo da página, selecione a data inicial e a data final desejadas. Você também pode usar os atalhos **Hoje**, **7 dias** ou **Mês atual**.

### Indicadores principais

- **Receita Bruta** — total de todas as vendas no período
- **Custo de Mercadoria (CMV)** — custo dos produtos vendidos
- **Receita Líquida** — receita bruta menos o custo

### Breakdown por pagamento

Mostra quanto foi recebido por cada forma de pagamento: Dinheiro, Crédito, Débito e Pix.

### Histórico de transações

Lista todas as vendas fechadas no período, com data, hora, mesa, forma de pagamento e valor.

### Mesas em aberto

Exibe as mesas com pedido ativo no momento, com o valor parcial de cada uma.

### Cancelamentos

Caso tenha havido cancelamentos no período, eles aparecem ao final da página com horário, mesa e motivo.

---

## Perguntas frequentes

**A mesa ficou travada e não consigo liberar.**
Use o botão **Liberar Mesa (emergência)** dentro do painel da mesa. Se não funcionar, informe o administrador.

**Adicionei o produto errado na comanda.**
Clique em **Remover** ao lado do item na lista da comanda antes de fechar a conta.

**Esqueci minha senha.**
Entre em contato com o administrador do sistema para redefinição.

**O sistema está com uma faixa amarela no topo.**
Você está conectado com o usuário de **Treinamento**. Nenhuma ação realizada será salva. Saia e entre com seu usuário normal.

**O estoque não está atualizando após fechar uma conta.**
A atualização automática do estoque ocorre apenas para produtos configurados com controle de inventário ativo. Verifique com o administrador se o produto está configurado corretamente.

---

## Logins do sistema

| Usuário | E-mail | Perfil |
|---|---|---|
| Administrador | admin@villamill.com | Acesso total |
| Caixa | caixa@villamill.com | Operacional |
| Treinamento | treinamento@villamill.com | Simulação (sem salvar) |

> As senhas são fornecidas pelo administrador. Mantenha-as em sigilo.

---

*Sistema desenvolvido por Willians de Oliveira Santana para Villa Mill Tamboré.*  
*Suporte: willians.legacy94@gmail.com*
