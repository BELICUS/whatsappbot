const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require('dotenv').config()

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
//menu.txt
const path  = require('path')
const fs = require('fs')
const chat = require('./chatgpt');
const { mediaMessageSHA256B64 } = require('@whiskeysockets/baileys')
//path
const menuPath = path.join(__dirname, 'mensajes' ,'menu.txt')
const menu = fs.readFileSync(menuPath, 'utf-8')

//chatgpt
const pathConsultas = path.join(__dirname, 'mensajes' ,'promptConsultas.txt')
const promptConsultas = fs.readFileSync(pathConsultas, 'utf-8')

//whisper
const {handlerAI} = require('./whisper');


const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer('esta es una nota de voz, el bot no funciona con notas de voz'/*, null, async(ctx,ctxFn) => {
    //const audioPath = ctx.audioPath;
    const text = await handlerAI(ctx);
    console.log(text)
}*/
);

// //asesor------------------------------
const flowAsesor = addKeyword(EVENTS.ACTION)
     .addAnswer('✅ Gracias, estamos atentos a tu consulta, un asesor se pondra en contacto contigo en menos de 5 minutos');

// //carta del menu
const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer('este es la carta de nuestro menu, https://drive.google.com/uc?export=download&id=1Cyd7PWnJMQVneV4dbxmcQaP90ak-Twho');



    //validar el nombre----------------------------
const flowNombre = addKeyword(EVENTS.ACTION)
    .addAnswer('Digite su nombre por favor:', { capture: true }, async (ctx, { fallBack, flowDynamic, gotoFlow}) => {
        const nombre = ctx.body.trim(); // Elimina espacios en blanco al inicio y al final
        if (!nombre || /[^a-zA-Z\s]/.test(nombre)) {
            // Si el nombre está vacío o contiene caracteres no válidos
            return fallBack('❌ Nombre no válido. Por favor, ingrese un nombre válido (solo letras).');
        }
        await flowDynamic(`✅ Gracias, ${nombre}.`);
        return gotoFlow(flowDireccion);
    });
     
//validar la direccion-------------------------
const flowDireccion = addKeyword(EVENTS.ACTION)
    .addAnswer('Por favor, escribe tu dirección, con su respectivo barrio:', { capture: true }, async (ctx, { fallBack, flowDynamic,gotoFlow }) => {
        const direccion = ctx.body.trim(); // Elimina espacios en blanco al inicio y al final
        if (!direccion || direccion.length < 5 || /[^a-zA-Z0-9\s,#.-]/.test(direccion)) {
            // Si la dirección está vacía, es muy corta o contiene caracteres no válidos
            return fallBack('❌ Dirección no válida. Por favor, ingrese una dirección válida (mínimo 5 caracteres, solo letras, números, espacios, y los caracteres , # . -).');
        }
        return await flowDynamic(`✅ Gracias, hemos registrado tu dirección: ${direccion}, estamos atentos a la screenshot de la transferencia, o si es en efectivo solo escribe la palabra *efectivo*`);
        //return gotoFlow(flowFoto);
    });

// //foto de la transferencia---------------------
const flowFoto = addKeyword(EVENTS.MEDIA)
    .addAnswer('✅ ¡Gracias! Hemos recibido tu comprobante de transferencia correctamente.');
//efectivo---------------------------------------
const flowEfectivo = addKeyword(['efectivo', 'Efectivo', 'EFECTIVO'])
    .addAnswer('✅ ¡Gracias! Hemos recibido que pagaras con efectivo.');

//flow de consulta----------------------------
const flowConsulta = addKeyword(EVENTS.ACTION)
    .addAnswer('hace tu consulta:', {capture:true}, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer =  await chat(prompt, consulta)
       
            //es para saber si responde algo
            //await flowDynamic(answer.content);
        await ctxFn.flowDynamic(answer.content);

        
    }); 

const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer('🙌 Hola bienvenido a este restaurante llamado *fastfood* mi nombre es michell estoy diseñada para procesar tu pedido')
    .addAnswer('🍔 ¿Que deseas comer?, todos los domicilios cuestan 3 dolares dentro de la zona urbana')
    .addAnswer('👉 *hamburguesa*: Deliciosa hamburguesa con papas fritas y gaseosa',
            '*precio*: 20 USD')
    .addAnswer('👉 *arepa rellena*:  deliciosa arepa rellena de pollo y carne con queso mas gaseosa',
    '*precio*: 10 USD',)
    .addAnswer('👉 *asado*: Delicioso asado de carne de res con papas a la francesa con una gaseosa',
    '*precio*: 30 USD',)
    .addAnswer('👉 si deseas pedir escribe *pedir*',);


const menuFlow =  addKeyword(['pedir', 'pedi', 'Pedir','PEDIR']).addAnswer(
    menu,
    { capture: true},
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!['1', '2', '3', '4', '0'].includes(ctx.body)) {
            return fallBack('opcion no valida');
        }
        switch (ctx.body) {
            case '1':
                return gotoFlow(flowMenu);
            case '2':
                return gotoFlow(flowNombre);
            case '3':
                return gotoFlow(flowConsulta);
            case '4':
                return gotoFlow(flowAsesor);
            case '0':
                return await flowDynamic('saliendo del menu... Puedes volver a escribir *pedir* para volver al menu');
        }
    }
);

    

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowWelcome, menuFlow, flowMenu, flowNombre, flowDireccion,flowFoto,flowConsulta, flowVoice, ,flowEfectivo, flowAsesor])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
