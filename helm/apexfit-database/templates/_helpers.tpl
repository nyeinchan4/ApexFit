{{/*
Expand the name of the chart.
*/}}
{{- define "apexfit-database.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "apexfit-database.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: apexfit
{{- end }}

{{/*
PostgreSQL hostname — works for embedded and external
*/}}
{{- define "apexfit-database.postgresHost" -}}
{{- if .Values.postgresql.enabled -}}
{{- printf "%s-postgresql" .Release.Name -}}
{{- else -}}
{{- .Values.externalPostgresql.host -}}
{{- end -}}
{{- end }}

{{/*
PostgreSQL port
*/}}
{{- define "apexfit-database.postgresPort" -}}
{{- if .Values.postgresql.enabled -}}
5432
{{- else -}}
{{- .Values.externalPostgresql.port | default 5432 -}}
{{- end -}}
{{- end }}
