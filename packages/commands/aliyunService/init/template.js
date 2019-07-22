exports.buildDockerConfigJsonYaml = ({ namespace, dockerConfigBase64 }) => `apiVersion: v1
data:
  .dockerconfigjson: ${dockerConfigBase64}
kind: Secret
metadata:
  name: aliyun-docker-registry
  namespace: ${namespace}
type: kubernetes.io/dockerconfigjson`

exports.buildNamespaceYaml = ({ namespace }) => `apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
`
