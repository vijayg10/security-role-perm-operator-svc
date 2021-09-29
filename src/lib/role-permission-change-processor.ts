/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Vijaya Kumar Guthi <vijaya.guthi@modusbox.com>
 --------------
 ******/

import Config from '../shared/config'
import { KetoTuples } from './keto-tuples'
import { logger } from '../shared/logger'

const oryKeto = new KetoTuples()

export class RolePermissionChangeProcessor {
  queue: string[][];
  timerOn: boolean;
  timeoutId: NodeJS.Timeout;

  constructor () {
    this.queue = []
    this.timerOn = true
    this.timeoutId = setTimeout(this._processQueue.bind(this))
  }

  _pushQueue (rolePermissionCombos: string []) : void {
    this.queue.push(rolePermissionCombos)
  }

  _popQueue () : string[] | undefined {
    return this.queue.shift()
  }

  _getFirstItemInQueue () : string[] | null {
    if (this.queue.length > 0) {
      return this.queue[0]
    } else {
      return null
    }
  }

  async _processQueue () : Promise<void> {
    if (this.timerOn) {
      const rolePermissionCombos = this._getFirstItemInQueue()
      if (rolePermissionCombos) {
        try {
          await this._updateRolePermissions(rolePermissionCombos)
          this._popQueue()
        } catch (err: any) {
          logger.error(err.message)
        }
      }
      this.timeoutId = setTimeout(this._processQueue.bind(this), Config.KETO_QUEUE_PROCESS_INTERVAL_MS)
    }
  }

  async _updateRolePermissions (rolePermissionCombos: string[]) : Promise<void> {
    await oryKeto.updateAllRolePermissions(rolePermissionCombos)
    logger.info('Updated the role permissions in Keto', rolePermissionCombos)
  }

  addToQueue (rolePermissionCombos: string[]) : void {
    this._pushQueue(rolePermissionCombos)
  }

  getQueue () : string[][] {
    return this.queue
  }

  // Helper functions for unit tests
  destroy () : void {
    this.timerOn = false
    clearTimeout(this.timeoutId)
  }

  getOryKeto () : KetoTuples {
    return oryKeto
  }
}
