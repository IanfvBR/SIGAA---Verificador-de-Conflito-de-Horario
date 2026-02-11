<h1>manifest.json</h1>
<p> O manifest foi criado para Mozilla Firefox, na versão v3, com permissão de activeTab e scripting, e hook para o background-script.js</p>
<h1>background-script.js</h1>
<p> Tudo que esse script faz é receber o evento do default action, quando se clica para executar a extensão, e injetar o content-script.js</p>
<h1>content-script.js</h1>
<p> Reutiliza o modulo content-manager.js do outro <a href="https://github.com/IanfvBR/calculadora-de-grade-horaria/tree/main">projeto</a>, lê os elementos da página e insere mensagens sinalizadoras informando
  se há ou não conflito de horário.</p>
