import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLAN_CONFIGS } from '../constants';
import { PlanKey } from '../types';

// Adicionado alias de tipo para os estilos de fonte para satisfazer a tipagem estrita do jspdf-autotable.
type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic';
// FIX: Added HAlignType to satisfy jspdf-autotable's strict typing for horizontal alignment.
type HAlignType = 'left' | 'center' | 'right' | 'justify';

// New data structure focusing on optimized credit usage and transparency.
const usageSuggestions: { [key in PlanKey]: { title: string; items: { description: string; quantity: number; credits: number }[] }[] } = {
    associado: [
        {
            title: 'Estratégia 1: Agência de Conteúdo Completa',
            items: [
                { description: 'Vídeos Longos (300s)', quantity: 2, credits: 42 },
                { description: 'Vídeos (180s)', quantity: 5, credits: 65 },
                { description: 'Reels (90s)', quantity: 15, credits: 105 },
                { description: 'Revistas Mangá (20 pág)', quantity: 4, credits: 164 },
                { description: 'Carrosséis (10 imagens)', quantity: 15, credits: 150 },
                { description: 'Imagens avulsas (Feed/Stories)', quantity: 74, credits: 74 },
            ]
        },
        {
            title: 'Estratégia 2: Dominação de Múltiplas Contas',
            items: [
                { description: 'Conta A: Vídeos Longos (300s)', quantity: 2, credits: 42 },
                { description: 'Conta A: Reels (90s)', quantity: 10, credits: 70 },
                { description: 'Conta B: Revistas Mangá (15 pág)', quantity: 4, credits: 124 },
                { description: 'Conta B: Carrosséis (10 imagens)', quantity: 10, credits: 100 },
                { description: 'Conteúdo Geral (Imagens Feed/Stories)', quantity: 264, credits: 264 },
            ]
        }
    ],
    studio: [
        {
            title: 'Estratégia 1: Criador de Mangá',
            items: [
                { description: 'Revistas Mangá (20 pág)', quantity: 2, credits: 82 },
                { description: 'Vídeos Animados (90s)', quantity: 4, credits: 28 },
                { description: 'Carrosséis para divulgação (10 img)', quantity: 4, credits: 40 },
                { description: 'Imagens para divulgação (Feed/Stories)', quantity: 100, credits: 100 },
            ]
        },
        {
            title: 'Estratégia 2: Produção de Vídeo Consistente',
            items: [
                { description: 'Vídeos (180s)', quantity: 4, credits: 52 },
                { description: 'Reels (90s)', quantity: 10, credits: 70 },
                { description: 'Carrosséis (8 imagens)', quantity: 13, credits: 104 },
                { description: 'Imagens avulsas (Thumbnails, etc)', quantity: 24, credits: 24 },
            ]
        }
    ],
    pro: [
        {
            title: 'Estratégia 1: Engajamento Misto no Instagram',
            items: [
                { description: 'Reels (60s)', quantity: 4, credits: 20 },
                { description: 'Carrosséis (5 imagens)', quantity: 4, credits: 20 },
                { description: 'Imagens para Feed/Stories', quantity: 60, credits: 60 },
            ]
        },
        {
            title: 'Estratégia 2: Foco em Vídeos Curtos',
            items: [
                { description: 'Reels para Instagram (60s)', quantity: 10, credits: 50 },
                { description: 'Shorts para YouTube (60s)', quantity: 10, credits: 50 },
            ]
        }
    ],
};

export const generateUsageSuggestionsPDF = () => {
    const doc = new jsPDF();

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#008080');
    doc.text('Kriative Social Studio - Guia de Uso de Créditos', 14, 22);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text('Inspire-se com estas sugestões para aproveitar ao máximo seu plano mensal.', 14, 30);

    let startY = 40;

    (Object.keys(PLAN_CONFIGS) as PlanKey[]).forEach(planKey => {
        if (startY > 220) { 
            doc.addPage();
            startY = 22;
        }

        const plan = PLAN_CONFIGS[planKey];
        const suggestions = usageSuggestions[planKey];

        // Título do Plano
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor('#ff8c00');
        doc.text(`${plan.name} (${plan.credits} créditos/mês)`, 14, startY);
        startY += 10;

        suggestions.forEach(suggestion => {
            const totalCredits = suggestion.items.reduce((sum, item) => sum + item.credits, 0);

            const head = [['Tipo de Conteúdo', 'Quantidade', 'Créditos Utilizados']];
            const body = suggestion.items.map(item => [item.description, item.quantity, item.credits]);
            const foot = [
                // FIX: Explicitly cast 'halign' to HAlignType to match jspdf-autotable's expected types.
                [{ content: 'Total da Estratégia', colSpan: 2, styles: { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle } }, { content: totalCredits, styles: { fontStyle: 'bold' as FontStyle } }]
            ];

            autoTable(doc, {
                startY: startY,
                // FIX: Explicitly cast 'halign' to HAlignType to match jspdf-autotable's expected types.
                head: [[{ content: suggestion.title, colSpan: 3, styles: { halign: 'center' as HAlignType, fontStyle: 'bold' as FontStyle, fillColor: '#008080' } }]],
                body,
                foot,
                theme: 'striped',
                headStyles: { fillColor: [0, 128, 128], textColor: 255 },
                footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
                didDrawPage: (data) => {
                    startY = data.cursor?.y ?? startY;
                }
            });
            startY += 10; 
        });
        startY += 5; 
    });

    doc.save('sugestoes-creditos-kriative-studio.pdf');
};