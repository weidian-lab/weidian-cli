exports.buildDockerConfigJsonYaml = ({ namespace }) => `apiVersion: v1
data:
  .dockerconfigjson: ${process.env.DOCKER_CONFIG_JSON}
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
