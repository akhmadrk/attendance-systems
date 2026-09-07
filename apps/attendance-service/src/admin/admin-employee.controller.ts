import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '@attendance/auth';
import { PAGINATION, toPaginatedResponse, UserRole } from '@attendance/common';
import { AdminEmployeeService } from './admin-employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { IdParamDto } from './dto/id-param.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('admin/employees')
@Roles(UserRole.HRD)
export class AdminEmployeeController {
  constructor(private readonly adminEmployeeService: AdminEmployeeService) {}

  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const result = await this.adminEmployeeService.list(page, limit, query.search);
    return toPaginatedResponse(result.data, page, limit, result.total);
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.adminEmployeeService.create(dto);
  }

  @Put(':id')
  update(@Param() params: IdParamDto, @Body() dto: UpdateEmployeeDto) {
    return this.adminEmployeeService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param() params: IdParamDto): Promise<void> {
    await this.adminEmployeeService.deactivate(params.id);
  }
}
