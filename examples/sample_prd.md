# PRD: Sistema de Despacho y Asignacion Inteligente de Rutas para Movilidad Urbana

## 1. Contexto y Problema
Las flotas de transporte urbano y mensajeria rapida pierden hasta un 24% de tiempo operativo en ruteo ineficiente, tiempos muertos de conductores y reasignaciones manuales. Se requiere un modulo inteligente que reciba pedidos de viaje o entrega, optimice las rutas considerando ventanas de tiempo y asigne el vehiculo optimo automaticamente.

## 2. Requerimientos Funcionales
- **Ingesta de Pedidos:** API para recibir solicitudes de servicio (origen, destino, ventana horaria, volumen).
- **Algoritmo de Ruteo y Despacho:** Asignacion basada en proximidad, capacidad del vehiculo y prediccion de trafico en tiempo real.
- **Notificaciones al Conductor:** Envio en tiempo real de orden de servicio con confirmacion de recepcion.
- **Telemetria y Geocercas:** Registro de coordenadas GPS cada 10 segundos y alertas cuando un vehiculo sale de su radio autorizado.
- **Dashboard Operativo:** Vista para despachadores con mapa interactivo de flotas activas y metricas de SLA.

## 3. Requerimientos No Funcionales
- Latencia de respuesta en la API de asignacion: < 800ms.
- Soporte para 5,000 vehiculos concurrentes enviando telemetria.
- Seguridad: Autenticacion JWT con permisos granulares (admin, dispatcher, driver).
