import { Badge } from "@/_components/ui/badge";
import { Card, CardContent } from "@/_components/ui/card";
import { Header } from "@/_components/ui/header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { Separator } from "@/_components/ui/separator";
import { ListChecks, LucideIcon, SquarePen, TicketPercent, Wallet } from "lucide-react";

interface CardDetail {
  title: string;
  value: string;
  Icon: LucideIcon;
}

interface ReportDetail {
  title: string;
  value: string;
}

const reportDetails: ReportDetail[] = [
  {
    title: "Quantidade",
    value: "10",
  },
  {
    title: "Receita",
    value: "R$ 10",
  },
];

const cardDetails: CardDetail[] = [
  {
    title: "Total de Vendas",
    value: "R$ 10.000,00",
    Icon: Wallet,
  },
  {
    title: "Pedidos",
    value: "47",
    Icon: SquarePen,
  },
  {
    title: "Ticket Médio",
    value: "R$ 212,77",
    Icon: TicketPercent,
  },
  {
    title: "Itens Vendidos",
    value: "120",
    Icon: ListChecks,
  },
];

export default function ReportPage() {
  return (
    <section className="flex flex-col h-screen">
      <div className="p-4">
        <Header title="Relatório" description="Relatório de vendas por período" />
      </div>

      <Separator className="h-px w-full" />

      <div className="p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="p-4 flex gap-4 w-full">
          {cardDetails.map((cardDetail) => (
            <Card key={cardDetail.title} className="flex-1">
              <CardContent className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-4">
                  <p className="font-medium">{cardDetail.title}</p>
                  <cardDetail.Icon size={16} />
                </div>
                <p className="mt-3">{cardDetail.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-4 flex gap-4 w-full">
          <Card className="flex-1">
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="font-medium">Consulta por produto</p>
                  <p className="text-xs text-muted-foreground">Vendas de um item específico em semana.</p>
                </div>
                <div>
                  <Select defaultValue="produto1">
                    <SelectTrigger className="w-100 shadow">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto1">Espresso</SelectItem>
                      <SelectItem value="produto2">Latte</SelectItem>
                      <SelectItem value="produto3">Mocha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-row items-center gap-4">
                {reportDetails.map((reportDetail) => (
                  <Badge key={reportDetail.title} variant="default" className="py-10 flex-1 flex flex-col rounded-sm">
                    <p className="font-medium text-base">{reportDetail.title}</p>
                    <span className="text-base">{reportDetail.value}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 flex gap-4 w-full">
          <Card className="flex-1">
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col">
                <p className="font-medium">Horários de pico</p>
                <p className="text-xs text-muted-foreground">Faturamento por horário do dia</p>
              </div>
              {/* Aqui você pode adicionar um gráfico ou tabela para mostrar os horários de pico */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
