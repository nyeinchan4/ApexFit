{{/*
Expand the name of the chart.
*/}}
{{- define "apexfit-backend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "apexfit-backend.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: apexfit
{{- end }}

{{/*
Selector labels for a given component
Usage: {{ include "apexfit-backend.selectorLabels" (dict "component" "api-gateway" "Release" .Release) }}
*/}}
{{- define "apexfit-backend.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Build full image reference
Usage: {{ include "apexfit-backend.image" (dict "svc" .Values.apiGateway "Values" .Values) }}
*/}}
{{- define "apexfit-backend.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repo := .svc.image.repository -}}
{{- $tag := .svc.image.tag | default .Values.image.tag -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry $repo $tag -}}
{{- else -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end -}}
{{- end }}
