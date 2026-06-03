import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Scale, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Calendar, 
  CheckSquare, 
  Shield,
  ArrowRight,
  BarChart3,
  Clock,
  Zap
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Gestión de Clientes",
    description: "Administra tu cartera de clientes con información completa y seguimiento detallado.",
  },
  {
    icon: Briefcase,
    title: "Casos Judiciales",
    description: "Control total de procesos con estados, actuaciones y términos procesales colombianos.",
  },
  {
    icon: FileText,
    title: "Documentos Legales",
    description: "Almacena y organiza demandas, memoriales, poderes y toda la documentación del caso.",
  },
  {
    icon: Receipt,
    title: "Facturación",
    description: "Genera facturas, controla honorarios y lleva el registro de pagos de tus clientes.",
  },
  {
    icon: Calendar,
    title: "Agenda de Reuniones",
    description: "Programa citas presenciales o virtuales con recordatorios automáticos.",
  },
  {
    icon: CheckSquare,
    title: "Tareas y Términos",
    description: "Nunca pierdas un término procesal con alertas y seguimiento de tareas.",
  },
]

const benefits = [
  {
    icon: Clock,
    title: "Ahorra tiempo",
    description: "Automatiza tareas repetitivas y enfócate en lo que importa: tus clientes.",
  },
  {
    icon: Shield,
    title: "Seguridad total",
    description: "Tus datos protegidos con encriptación y respaldos automáticos.",
  },
  {
    icon: BarChart3,
    title: "Métricas claras",
    description: "Dashboard con indicadores clave para tomar mejores decisiones.",
  },
  {
    icon: Zap,
    title: "Acceso inmediato",
    description: "Trabaja desde cualquier lugar con acceso web seguro 24/7.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Punto Cero Legal</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/registro">Comenzar gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
            Software de gestión legal diseñado para Colombia
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Administra tu firma de abogados con herramientas especializadas para el sistema judicial colombiano. 
            Casos, clientes, documentos y facturación en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/registro">
                Prueba gratis 30 días
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas para tu firma</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para el ejercicio del derecho en Colombia
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Por qué Punto Cero Legal?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              La solución más completa para firmas de abogados en Colombia
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comienza hoy mismo</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Únete a las firmas que ya están transformando su práctica legal con Punto Cero Legal
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/registro">
              Crear cuenta gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold">Punto Cero Legal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Punto Cero Legal. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
