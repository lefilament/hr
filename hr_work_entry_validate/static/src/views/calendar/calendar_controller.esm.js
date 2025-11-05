import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { WorkEntryCalendarView, WorkEntryCalendarController } from "@hr_work_entry_contract/views/work_entry_calendar/work_entry_calendar_controller";

export class ValidateWorkEntryCalendarController extends WorkEntryCalendarController {
  setup() {
    super.setup(...arguments);
    this.notification = useService("notification");
    // console.log(this);
  }

  // only display button if month or week
  get displayValidateButton() {
    return this.model.meta.scale == "week" || this.model.meta.scale == "month";
  }

  // tell if any record is still draft
  get anyDraft() {
    return this.filteredRecords.length != 0;
  }

  // get current draft records
  get filteredRecords() {
    return this.filterRecords(
      this.model.data.records,
      "draft"
    );
  }

  // filter records based on current month / week and state
  filterRecords(records, state) {
    const {start, end} = this.model.computeRange()
    // filter records
    return Object.values(records).filter(
      (record) =>
        record.start > start &&
        record.end < end &&
        record.rawRecord.state == state
    );
  }

  // call action_validate on current records
  async validate() {
    const record_ids = this.filteredRecords.map((r) => r.id);
    console.log("Validating records", record_ids);
    const success = await this.orm.call("hr.work.entry", "action_validate", [
      record_ids,
    ]);
    if (success) {
      // refresh
      this.model.env.searchModel.search();
      // notify success
      this.notification.add(
        _t("%s work entries validated", record_ids.length),
        {
          title: "Ok",
          type: "success",
        }
      );
    } else {
      // notify failure
      this.notification.add(_t("Work entries could not be validated."), {
        title: _t("Error"),
        type: "danger",
      });
    }
  }
}

export const ValidateWorkEntryCalendarView = {
  ...WorkEntryCalendarView,
  Controller: ValidateWorkEntryCalendarController,
  buttonTemplate: "hr_work_entry_validate.calendar.controlButtons",
};

registry.category("views").add("validate_work_entries_calendar", ValidateWorkEntryCalendarView);
