{{/*
Expand the name of the chart.
*/}}
{{- define "apexfit.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this.
*/}}
{{- define "apexfit.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label
*/}}
{{- define "apexfit.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "apexfit.labels" -}}
helm.sh/chart: {{ include "apexfit.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for a given component (pass dict with "component" key)
Usage: {{ include "apexfit.selectorLabels" (dict "component" "user-service" "Release" .Release) }}
*/}}
{{- define "apexfit.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Resolve image tag: prefer per-service tag, fall back to global .Values.image.tag
Usage: {{ include "apexfit.imageTag" (dict "svc" .Values.userService "Values" .Values) }}
*/}}
{{- define "apexfit.imageTag" -}}
{{- $tag := .svc.image.tag | default .Values.image.tag -}}
{{- $tag -}}
{{- end }}

{{/*
Build full image reference
Usage: {{ include "apexfit.image" (dict "svc" .Values.userService "Values" .Values) }}
*/}}
{{- define "apexfit.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repo := .svc.image.repository -}}
{{- $tag := include "apexfit.imageTag" . -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry $repo $tag -}}
{{- else -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end -}}
{{- end }}

{{/*
PostgreSQL service hostname (works for both embedded chart and external)
*/}}
{{- define "apexfit.postgresHost" -}}
{{- if .Values.postgresql.enabled -}}
{{- printf "%s-postgresql" .Release.Name -}}
{{- else -}}
{{- .Values.externalPostgresql.host -}}
{{- end -}}
{{- end }}

{{/*
PostgreSQL port
*/}}
{{- define "apexfit.postgresPort" -}}
{{- if .Values.postgresql.enabled -}}
5432
{{- else -}}
{{- .Values.externalPostgresql.port | default 5432 -}}
{{- end -}}
{{- end }}
