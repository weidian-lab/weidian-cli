const inquirer = require('inquirer')
const { exec } = require('./command')
const childProcess = require('child_process')
const AliyunLog = require('alicloud-log')

const {
  buildDockerConfigJsonYaml,
  buildNamespaceYaml
} = require('./template')

const {
  NAMESPACE = 'test',
  REGION = 'cn-hangzhou',
  ACCESSKEY,
  DOCKER_CONFIG_JSON,
  ACCESSKEY_SECRET,
} = process.env

const readConfig = async (config) => {
  const promps = []
  promps.push({
    type: 'input',
    name: 'name',
    default: config.name,
    message: '服务名称',
    validate: function (input){
      if(!input) {
        return '不能为空'
      }
      return true
    }
  })
  if (!config.dockerConfigBase64) {
    promps.push({
      type: 'input',
      default: DOCKER_CONFIG_JSON,
      name: 'dockerConfigBase64',
      message: '请输入dockerconfigjson',
      validate: function (input){
        if(!input) {
          return '不能为空'
        }
        return true
      }
    })
  }
  if (!config.namespace) {
    promps.push({
      type: 'input',
      default: NAMESPACE,
      name: 'namespace',
      message: '请输入命名空间',
      validate: function (input){
        if(!input) {
          return '不能为空'
        }
        return true
      }
    })
  }
  if (!config.logProjectName) {
    promps.push({
      type: 'input',
      default: 'weidian-lab-develop',
      name: 'logProjectName',
      message: '请输入日志库项目',
      validate: function (input){
        if(!input) {
          return '不能为空'
        }
        return true
      }
    })
  }
  promps.push({
    type: 'input',
    name: 'appEnv',
    default: 'test',
    message: '请输入应用环境',
    validate: function (input){
      if(!input) {
        return '不能为空'
      }
      return true
    }
  })
  const answers = await inquirer.prompt(promps)
  Object.assign(config, answers)
}

const initKubernetes = async (config) => {
  await exec(`echo "${buildNamespaceYaml(config)}" | kubectl apply -f -`)
  await exec(`echo "${buildDockerConfigJsonYaml(config)}" | kubectl apply -f -`)
}

const initLogStore = async (config) => {
  const { logProjectName, appEnv, namespace, name } = config
  const client = new AliyunLog({
    accessKeyId: ACCESSKEY,
    accessKeySecret: ACCESSKEY_SECRET,
    region: REGION,
  });
  const logstoreName = `ecilogs-${namespace}-${appEnv}`
  const logStore = await client.getLogStore(logProjectName, logstoreName).catch(() => null)
  const logStoreConfig = await client.restGet(logProjectName, 'configs', logstoreName).catch(() => null)
  if (!logStore) {
    console.log('创建日志库')
    await client.createLogStore(config.logProjectName, logstoreName, {
      ttl: 10,
      shardCount: 2
    })
  }
  if (!logStoreConfig) {
    await client.restCreate(logProjectName, 'configs', {
      configName: logstoreName,
      inputType: 'file',
      logSample: '2018-11-16 10:42:33,575 INFO 81 [egg-sequelize](3ms) Executed (default): SELECT 1+1 AS result',
      inputDetail: {
        enableRawLog: true,
        discardUnmatch: true,
        preserve: true,
        localStorage: true,
        logType: 'common_reg_log',
        logPath: `/ecilogs-${namespace}-${appEnv}`,
        logBeginRegex: '\\d+-\\d+-\\d+\\s\\d+:\\d+:\\d+,\\d+\\s.*',
        localStorage: true,
        timeFormat: '',
        key: [ 'content' ],
        regex: '(.*)',
        fileEncoding: 'utf8',
        filePattern: '*.log',
        topicFormat: 'none'
      },
      outputType: 'LogService',
      outputDetail: {
        endpoint: 'cn-hangzhou-intranet.log.aliyuncs.com',
        logstoreName,
         region: 'cn-hangzhou'
      }
    })
  }
  const machineGroupName = `logtail-${namespace}-${name}-${appEnv}`
  const machineGroup = await client.restGet(logProjectName, 'machinegroups', machineGroupName).catch(() => null)
  if (!machineGroup) {
    console.log('创建机器组')
    await client.restCreate(logProjectName, 'machinegroups', {
      machineIdentifyType: 'userdefined',
      groupName: machineGroupName,
      machineList: [`${config.namespace}-${config.name}-${config.appEnv}`]
    })
    await client.applyConfigToMachineGroup(logProjectName, machineGroupName, logstoreName)
  }
}

module.exports = async (config, options) => {
  await readConfig(config)
  if (options.debug) {
    console.log(config)
  }
  await initKubernetes(config)
  await initLogStore(config)
}
